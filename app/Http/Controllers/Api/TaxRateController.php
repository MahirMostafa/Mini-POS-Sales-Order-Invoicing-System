<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\AccountingRepositoryInterface;
use App\Contracts\Repositories\TaxRateRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaxRateController extends Controller
{
    public function __construct(
        protected TaxRateRepositoryInterface $taxRateRepo,
        protected AccountingRepositoryInterface $accountingRepo
    ) {
    }

    public function index(): JsonResponse
    {
        $taxRates = $this->taxRateRepo->all();
        $accounts = $this->accountingRepo->getActiveAccounts();

        return response()->json([
            'success' => true,
            'tax_rates' => $taxRates,
            'accounts' => $accounts,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'account_id' => 'nullable|exists:chart_of_accounts,id',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $taxRate = $this->taxRateRepo->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tax rate created successfully.',
            'tax_rate' => $taxRate,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $taxRate = $this->taxRateRepo->findById($id);
        if (!$taxRate) {
            return response()->json(['success' => false, 'message' => 'Tax rate not found.'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'account_id' => 'nullable|exists:chart_of_accounts,id',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $this->taxRateRepo->update($taxRate, $validated);

        return response()->json([
            'success' => true,
            'message' => 'Tax rate updated successfully.',
            'tax_rate' => $taxRate->fresh(),
        ]);
    }

    public function setDefault(int $id): JsonResponse
    {
        $taxRate = $this->taxRateRepo->findById($id);
        if (!$taxRate) {
            return response()->json(['success' => false, 'message' => 'Tax rate not found.'], 404);
        }

        $this->taxRateRepo->setDefault($taxRate);

        return response()->json([
            'success' => true,
            'message' => "'{$taxRate->name}' is now set as the default tax rate.",
        ]);
    }
}
