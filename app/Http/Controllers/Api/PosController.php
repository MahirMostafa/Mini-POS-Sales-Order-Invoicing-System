<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Contracts\Repositories\TaxRateRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\ProductCategory;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosController extends Controller
{
    public function __construct(
        protected ProductRepositoryInterface $productRepo,
        protected ProductVariantRepositoryInterface $variantRepo,
        protected CustomerRepositoryInterface $customerRepo,
        protected TaxRateRepositoryInterface $taxRateRepo
    ) {
    }

    public function init(): JsonResponse
    {
        $products = $this->productRepo->getActiveWithVariants();
        $categories = ProductCategory::where('is_active', true)->orderBy('name')->get();
        $customers = $this->customerRepo->getActive();
        $taxRates = $this->taxRateRepo->getActive();
        $defaultTaxRate = $this->taxRateRepo->getDefault();
        $currency = Setting::get('currency_symbol', '৳');
        $companyName = Setting::get('company_name', 'Mini POS Enterprise');

        return response()->json([
            'success' => true,
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'tax_rates' => $taxRates,
            'default_tax_rate' => $defaultTaxRate,
            'currency' => $currency,
            'company_name' => $companyName,
        ]);
    }

    public function search(Request $request): JsonResponse
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
}
