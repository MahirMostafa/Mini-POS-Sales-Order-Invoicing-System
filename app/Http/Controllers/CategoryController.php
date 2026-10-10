<?php

namespace App\Http\Controllers;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Contracts\Services\AuditServiceInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function __construct(
        protected CategoryRepositoryInterface $categoryRepo,
        protected AuditServiceInterface $auditService
    ) {}

    /**
     * Display a listing of product categories with associated product counts.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->filled('search') ? trim($request->query('search')) : null;
        $isActive = null;
        if ($request->has('status') && $request->query('status') !== 'all' && $request->query('status') !== '') {
            $isActive = filter_var($request->query('status'), FILTER_VALIDATE_BOOLEAN);
        }

        $categories = $this->categoryRepo->getWithProductsCount($search, $isActive);
        $metrics = $this->categoryRepo->getMetrics();

        return response()->json([
            'success' => true,
            'categories' => $categories,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Store a newly created category in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:product_categories,name',
            'slug' => 'nullable|string|max:120|unique:product_categories,slug',
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $category = $this->categoryRepo->create($validated);

        // Audit Log: Category Created
        $this->auditService->log(
            event: 'category_created',
            auditableType: 'App\Models\ProductCategory',
            auditableId: $category->id,
            oldValues: null,
            newValues: [
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
            ],
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Category '{$category->name}' created successfully.",
            'category' => $category->loadCount('products'),
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(int $id): JsonResponse
    {
        $category = $this->categoryRepo->findById($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'category' => $category,
        ]);
    }

    /**
     * Update the specified category in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $category = $this->categoryRepo->findById($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.',
            ], 404);
        }

        $validated = $request->validate([
            'name' => "required|string|max:100|unique:product_categories,name,{$id}",
            'slug' => "nullable|string|max:120|unique:product_categories,slug,{$id}",
            'description' => 'nullable|string|max:500',
            'is_active' => 'nullable|boolean',
        ]);

        $oldData = [
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
        ];

        $this->categoryRepo->update($category, $validated);

        // Audit Log: Category Updated
        $this->auditService->log(
            event: 'category_updated',
            auditableType: 'App\Models\ProductCategory',
            auditableId: $category->id,
            oldValues: $oldData,
            newValues: [
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
            ],
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Category '{$category->name}' updated successfully.",
            'category' => $category->fresh()->loadCount('products'),
        ]);
    }

    /**
     * Toggle the active status of the category.
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $category = $this->categoryRepo->findById($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.',
            ], 404);
        }

        $this->categoryRepo->update($category, [
            'is_active' => !$category->is_active,
        ]);

        $statusLabel = $category->fresh()->is_active ? 'activated' : 'deactivated';

        return response()->json([
            'success' => true,
            'message' => "Category '{$category->name}' was {$statusLabel}.",
            'category' => $category->fresh()->loadCount('products'),
        ]);
    }

    /**
     * Remove the specified category from storage.
     */
    public function destroy(int $id): JsonResponse
    {
        $category = $this->categoryRepo->findById($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.',
            ], 404);
        }

        if ($category->products_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete category '{$category->name}' because it is assigned to {$category->products_count} product(s). Please reassign or delete the products first.",
            ], 422);
        }

        $categoryName = $category->name;
        $oldData = [
            'name' => $category->name,
            'slug' => $category->slug,
        ];

        $this->categoryRepo->delete($category);

        // Audit Log: Category Deleted
        $this->auditService->log(
            event: 'category_deleted',
            auditableType: 'App\Models\ProductCategory',
            auditableId: $id,
            oldValues: $oldData,
            newValues: null,
            userId: auth()->id() ?? 1
        );

        return response()->json([
            'success' => true,
            'message' => "Category '{$categoryName}' deleted successfully.",
        ]);
    }
}
