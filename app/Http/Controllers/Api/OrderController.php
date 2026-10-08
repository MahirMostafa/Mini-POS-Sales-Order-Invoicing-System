<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\OrderRepositoryInterface;
use App\Contracts\Services\OrderServiceInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\CompleteOrderRequest;
use App\Http\Requests\StoreOrderRequest;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        protected OrderServiceInterface $orderService,
        protected OrderRepositoryInterface $orderRepo
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'status' => $request->get('status'),
            'payment_status' => $request->get('payment_status'),
            'customer_id' => $request->get('customer_id'),
            'search' => $request->get('search'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        $orders = $this->orderRepo->paginate($request->integer('per_page', 15), $filters);

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $order = $this->orderRepo->findById($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $stockCheck = $order->isPending() 
            ? $this->orderService->validateStockAvailability($order) 
            : ['is_available' => true, 'items' => []];

        return response()->json([
            'success' => true,
            'order' => $order,
            'stock_check' => $stockCheck,
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        try {
            $userId = auth()->id() ?? 1;
            $order = $this->orderService->createOrder($request->validated(), $userId);

            return response()->json([
                'success' => true,
                'message' => $order->isCompleted() 
                    ? "Order #{$order->order_number} completed & invoice issued!" 
                    : "Order #{$order->order_number} saved as Pending.",
                'order' => $order->load(['invoice', 'items.variant.product']),
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

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

    public function complete(CompleteOrderRequest $request, int $id): JsonResponse
    {
        $order = $this->orderRepo->findById($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        $paidAmount = $request->filled('paid_amount') ? (float) $request->paid_amount : null;
        $paymentMethod = $request->get('payment_method');

        $result = $this->orderService->completeOrder($order, $paidAmount, $paymentMethod);

        return response()->json($result, $result['success'] ? 200 : 422);
    }

    public function cancel(Request $request, int $id): JsonResponse
    {
        $order = $this->orderRepo->findById($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
        }

        try {
            $reason = $request->get('reason', 'Cancelled by user');
            $this->orderService->cancelOrder($order, $reason);

            return response()->json([
                'success' => true,
                'message' => "Order #{$order->order_number} has been cancelled.",
                'order' => $order->fresh(),
            ]);
        } catch (Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
