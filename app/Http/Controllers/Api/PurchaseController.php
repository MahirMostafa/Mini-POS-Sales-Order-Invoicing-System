<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\PurchaseRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function __construct(
        protected PurchaseRepositoryInterface $purchaseRepo
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'search' => $request->get('search'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
            'payment_method' => $request->get('payment_method'),
        ];

        $perPage = $request->integer('per_page', 15);
        $purchases = $this->purchaseRepo->paginate($perPage, $filters);
        $summary = $this->purchaseRepo->getSummary($filters);
        $suppliers = $this->purchaseRepo->getRecentSuppliers(20);

        return response()->json([
            'success' => true,
            'purchases' => $purchases,
            'summary' => $summary,
            'suppliers' => $suppliers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'supplier_name' => 'required|string|max:255',
            'supplier_phone' => 'nullable|string|max:50',
            'supplier_invoice_no' => 'nullable|string|max:50',
            'purchase_date' => 'required|date',
            'payment_method' => 'required|string|in:cash,bank_transfer,card,credit',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $userId = auth()->id() ?? 1;
        $purchase = $this->purchaseRepo->create($validated, $validated['items'], $userId);

        return response()->json([
            'success' => true,
            'message' => "Purchase Order #{$purchase->purchase_number} recorded and stock replenished successfully.",
            'purchase' => $purchase,
        ], 201);
    }
}
