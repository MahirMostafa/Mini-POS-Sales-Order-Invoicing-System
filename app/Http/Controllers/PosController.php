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
        $paginator = \App\Models\Product::with(['category', 'variants' => function ($q) {
            $q->where('is_active', true);
        }])
        ->where('is_active', true)
        ->orderBy('name')
        ->paginate(100);

        $categories = $this->categoryRepo->getActive();
        $customers = $this->customerRepo->getActive();
        $taxRates = $this->taxRateRepo->getActive();
        $defaultTaxRate = $this->taxRateRepo->getDefault();
        $currency = $this->settingRepo->getCurrencySymbol();
        $company = $this->settingRepo->getCompanyInfo();
        $bankAccounts = \App\Models\BankAccount::where('is_active', true)->with('chartOfAccount')->get();

        return response()->json([
            'success' => true,
            'products' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_more' => $paginator->hasMorePages(),
            ],
            'categories' => $categories,
            'customers' => $customers,
            'bank_accounts' => $bankAccounts,
            'tax_rates' => $taxRates,
            'default_tax_rate' => $defaultTaxRate,
            'currency' => $currency,
            'company' => $company,
            'company_name' => $company['name'],
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->get('per_page', 100), 10), 200);
        $categoryId = $request->get('category_id');
        $query = trim((string) $request->get('q', ''));

        $builder = \App\Models\Product::with(['category', 'variants' => function ($q) {
            $q->where('is_active', true);
        }])
        ->where('is_active', true);

        if ($categoryId && $categoryId !== 'all') {
            $builder->where('category_id', $categoryId);
        }

        if ($query !== '') {
            $builder->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('brand', 'like', "%{$query}%")
                  ->orWhereHas('variants', function ($vq) use ($query) {
                      $vq->where('sku', 'like', "%{$query}%")
                         ->orWhere('barcode', 'like', "%{$query}%")
                         ->orWhere('variant_name', 'like', "%{$query}%");
                  });
            });
        }

        $paginator = $builder->orderBy('name')->paginate($perPage);

        return response()->json([
            'success' => true,
            'products' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'has_more' => $paginator->hasMorePages(),
            ],
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $query = trim((string) $request->get('q', ''));
        $barcode = trim((string) $request->get('barcode', ''));

        if ($barcode !== '') {
            $variant = \App\Models\ProductVariant::with(['product.category', 'product.variants'])
                ->where(function ($q) use ($barcode) {
                    $q->where('barcode', $barcode)
                      ->orWhere('sku', $barcode);
                })
                ->where('is_active', true)
                ->first();

            if ($variant) {
                return response()->json([
                    'success' => true,
                    'variant' => $variant,
                    'product' => $variant->product,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => "No product variant matching barcode or SKU: '{$barcode}' in entire inventory.",
            ], 404);
        }

        return $this->products($request);
    }
}
