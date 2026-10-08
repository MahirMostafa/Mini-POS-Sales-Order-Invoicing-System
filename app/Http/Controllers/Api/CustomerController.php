<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CustomerRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerRepositoryInterface $customerRepo
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $customers = $this->customerRepo->paginate(
            $request->integer('per_page', 15),
            $request->get('search')
        );

        return response()->json([
            'success' => true,
            'customers' => $customers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'tax_number' => 'nullable|string|max:50',
        ]);

        $customer = $this->customerRepo->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully.',
            'customer' => $customer,
        ], 201);
    }
}
