<?php

namespace App\Repositories;

use App\Contracts\Repositories\SettingRepositoryInterface;
use App\Models\Setting;

class EloquentSettingRepository implements SettingRepositoryInterface
{
    public function get(string $key, mixed $default = null): mixed
    {
        return Setting::get($key, $default);
    }

    public function set(string $key, mixed $value, string $type = 'string'): bool
    {
        Setting::set($key, $value, $type);
        return true;
    }

    public function getCompanyInfo(): array
    {
        $currency = $this->getCurrencySymbol();
        return [
            'name' => Setting::get('company_name', 'MINI POS & RETAIL HUB'),
            'address' => Setting::get('company_address', 'Dhaka, Bangladesh'),
            'phone' => Setting::get('company_phone', '+880 1700-000000'),
            'email' => Setting::get('company_email', 'billing@minipos.com'),
            'tax_bin' => Setting::get('tax_number', 'BIN-99201928'),
            'tax_number' => Setting::get('tax_number', 'BIN-99201928'),
            'currency' => $currency,
        ];
    }

    public function getCurrencySymbol(): string
    {
        return Setting::get('currency_symbol', '৳');
    }
}
