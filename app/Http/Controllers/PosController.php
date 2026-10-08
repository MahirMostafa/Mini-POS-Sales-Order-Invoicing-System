<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Contracts\Repositories\ProductRepositoryInterface;
use App\Contracts\Repositories\ProductVariantRepositoryInterface;
use App\Contracts\Repositories\SettingRepositoryInterface;
use App\Contracts\Repositories\TaxRateRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosController extends Controller
{
    public function __construct(
        protected ProductRepositoryInterface $productRepo,
        protected ProductVariantRepositoryInterface $variantRepo,
        protected CustomerRepositoryInterface $customerRepo,
        protected TaxRateRepositoryInterface $taxRateRepo,
        protected CategoryRepositoryInterface $categoryRepo,
        protected SettingRepositoryInterface $settingRepo
    ) {
    }

    public function init(): JsonResponse
    {
        $products = $this->productRepo->getActiveWithVariants();
        $categories = $this->categoryRepo->getActive();
        $customers = $this->customerRepo->getActive();
        $taxRates = $this->taxRateRepo->getActive();
        $defaultTaxRate = $this->taxRateRepo->getDefault();
        $currency = $this->settingRepo->getCurrencySymbol();
        $company = $this->settingRepo->getCompanyInfo();

        return response()->json([
            'success' => true,
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'tax_rates' => $taxRates,
            'default_tax_rate' => $defaultTaxRate,
            'currency' => $currency,
            'company' => $company,
            'company_name' => $company['name'],
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
