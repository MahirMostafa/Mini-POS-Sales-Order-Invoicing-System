<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'paid_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:cash,bank_transfer,card,credit',
        ];
    }
}
