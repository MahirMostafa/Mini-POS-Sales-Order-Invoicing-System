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
        $filters = [
            'status' => $request->get('status'),
            'customer_id' => $request->get('customer_id'),
            'search' => $request->get('search'),
        ];

        $invoices = $this->invoiceRepo->paginate($request->integer('per_page', 15), $filters);

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
