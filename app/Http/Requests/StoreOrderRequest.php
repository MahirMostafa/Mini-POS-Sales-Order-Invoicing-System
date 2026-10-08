<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'order_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'tax_rate_id' => 'nullable|exists:tax_rates,id',
            'payment_method' => 'nullable|in:cash,bank_transfer,card,credit',
            'discount_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:percent,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'auto_complete' => 'nullable|boolean',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'nullable|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'customer_id.required' => 'Please select a customer for this order.',
            'items.required' => 'Please add at least one product item to the order.',
            'items.min' => 'Please add at least one product item to the order.',
            'items.*.quantity.min' => 'Item quantity must be at least 1.',
        ];
    }
}
