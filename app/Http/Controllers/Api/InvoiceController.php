<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\InvoiceRepositoryInterface;
use App\Contracts\Services\InvoiceServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    public function __construct(
        protected InvoiceRepositoryInterface $invoiceRepo,
        protected InvoiceServiceInterface $invoiceService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $filters = [
            'status' => $request->get('status'),
            'payment_status' => $request->get('payment_status'),
            'customer_id' => $request->get('customer_id'),
            'search' => $request->get('search'),
            'start_date' => $request->get('start_date'),
            'end_date' => $request->get('end_date'),
        ];

        // Non-admin and non-accountant roles only see their own sales receipts
        if ($user && !$user->hasRole('Admin') && !$user->hasRole('Accountant')) {
            $filters['user_id'] = $user->id;
        }

        $perPage = $request->integer('per_page', 10);
        $invoices = $this->invoiceRepo->paginate($perPage, $filters);

        return response()->json([
            'success' => true,
            'invoices' => $invoices,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $invoice = $this->invoiceRepo->findById($id);
        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found.'], 404);
        }

        $printData = $this->invoiceService->getPrintableInvoiceData($invoice);

        return response()->json([
            'success' => true,
            'invoice' => $invoice,
            'company' => $printData['company'],
        ]);
    }
}
