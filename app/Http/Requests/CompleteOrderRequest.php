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
            'payment_method' => 'nullable|in:cash,bank_transfer,card,digital,credit',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'chart_of_account_id' => 'nullable|exists:chart_of_accounts,id',
        ];
    }
}
