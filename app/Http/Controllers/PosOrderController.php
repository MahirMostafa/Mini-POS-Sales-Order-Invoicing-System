<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Contracts\Repositories\OrderRepositoryInterface;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Contracts\Repositories\TaxRateRepositoryInterface;
use App\Contracts\Services\OrderServiceInterface;
use App\Http\Requests\CompleteOrderRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Order;
use App\Models\ProductCategory;
use App\Models\Setting;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosOrderController extends Controller
{
    public function __construct(
        protected OrderServiceInterface $orderService,
        protected OrderRepositoryInterface $orderRepo,
        protected ProductRepositoryInterface $productRepo,
        protected ProductVariantRepositoryInterface $variantRepo,
        protected CustomerRepositoryInterface $customerRepo,
        protected TaxRateRepositoryInterface $taxRateRepo
    ) {
    }

    /**
     * Main POS Terminal Screen
     */
    public function index()
    {
        $products = $this->productRepo->getActiveWithVariants();
        $categories = ProductCategory::where('is_active', true)->orderBy('name')->get();
        $customers = $this->customerRepo->getActive();
        $taxRates = $this->taxRateRepo->getActive();
        $defaultTaxRate = $this->taxRateRepo->getDefault();
        $currencySymbol = Setting::get('currency_symbol', '৳');

        return view('pos.index', compact(
            'products',
            'categories',
            'customers',
            'taxRates',
            'defaultTaxRate',
            'currencySymbol'
        ));
    }

    /**
     * Search Products & Barcode API for POS
     */
    public function searchProducts(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        $barcode = $request->get('barcode', '');

        if ($barcode) {
            $variant = $this->variantRepo->findByBarcode($barcode);
            if ($variant) {
                return response()->json([
                    'success' => true,
                    'variant' => $variant->load('product'),
                ]);
            }
            return response()->json(['success' => false, 'message' => 'No item matching barcode found.'], 404);
        }

        $products = $this->productRepo->searchForPos($query);

        return response()->json([
            'success' => true,
            'products' => $products,
        ]);
    }

    /**
     * Store New Order (Pending or Instant Complete)
     */
    public function store(StoreOrderRequest $request)
    {
        try {
            $userId = auth()->id() ?? 1;
            $order = $this->orderService->createOrder($request->validated(), $userId);

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => $order->isCompleted() 
                        ? "Order #{$order->order_number} completed & invoice issued!" 
                        : "Order #{$order->order_number} created in Pending status.",
                    'order' => $order->load(['invoice', 'items.variant']),
                    'redirect_url' => $order->invoice 
                        ? route('invoices.show', $order->invoice->id) 
                        : route('orders.show', $order->id),
                ]);
            }

            $msg = $order->isCompleted() 
                ? "Order #{$order->order_number} completed successfully with Invoice #{$order->invoice?->invoice_number}!" 
                : "Order #{$order->order_number} saved as Pending.";

            return redirect()->route('orders.show', $order->id)->with('success', $msg);
        } catch (Exception $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }

            return back()->withInput()->with('error', $e->getMessage());
        }
    }

    /**
     * Sales Order List
     */
    public function orderList(Request $request)
    {
        $filters = [
            'status' => $request->get('status'),
            'payment_status' => $request->get('payment_status'),
            'customer_id' => $request->get('customer_id'),
            'search' => $request->get('search'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        $orders = $this->orderRepo->paginate(15, $filters);
        $customers = $this->customerRepo->getActive();
        $currencySymbol = Setting::get('currency_symbol', '৳');

        return view('orders.index', compact('orders', 'customers', 'filters', 'currencySymbol'));
    }

    /**
     * View Sales Order Details
     */
    public function show(int $id)
    {
        $order = $this->orderRepo->findById($id);
        if (!$order) {
            abort(404, 'Order not found.');
        }

        $stockCheck = $order->isPending() ? $this->orderService->validateStockAvailability($order) : ['is_available' => true, 'items' => []];
        $currencySymbol = Setting::get('currency_symbol', '৳');

        return view('orders.show', compact('order', 'stockCheck', 'currencySymbol'));
    }

    /**
     * Validate Stock Availability Check (AJAX)
     */
    public function validateStock(int $id): JsonResponse
    {
        $order = $this->orderRepo->findById($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $result = $this->orderService->validateStockAvailability($order);

        return response()->json([
            'success' => true,
            'is_available' => $result['is_available'],
            'items' => $result['items'],
        ]);
    }

    /**
     * Complete Order Action (Atomic Stock Deduction & Double-Entry Accounting Posting)
     */
    public function complete(CompleteOrderRequest $request, int $id)
    {
        $order = $this->orderRepo->findById($id);
        if (!$order) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
            }
            return back()->with('error', 'Order not found.');
        }

        $paidAmount = $request->filled('paid_amount') ? (float) $request->paid_amount : null;
        $paymentMethod = $request->get('payment_method');

        $result = $this->orderService->completeOrder($order, $paidAmount, $paymentMethod);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json($result, $result['success'] ? 200 : 422);
        }

        if ($result['success']) {
            return redirect()->route('orders.show', $order->id)->with('success', $result['message']);
        }

        return back()->with('error', $result['message']);
    }

    /**
     * Cancel Pending Order
     */
    public function cancel(Request $request, int $id)
    {
        $order = $this->orderRepo->findById($id);
        if (!$order) {
            return back()->with('error', 'Order not found.');
        }

        try {
            $reason = $request->get('reason', 'Cancelled by user');
            $this->orderService->cancelOrder($order, $reason);

            return redirect()->route('orders.show', $order->id)
                ->with('success', "Order #{$order->order_number} has been cancelled.");
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
