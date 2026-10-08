<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'company_name', 'value' => 'Apex Retail & Invoicing Solutions', 'type' => 'string'],
            ['key' => 'company_address', 'value' => 'Suite 401, Gulshan Avenue, Dhaka, Bangladesh', 'type' => 'string'],
            ['key' => 'company_phone', 'value' => '+880 1800-112233', 'type' => 'string'],
            ['key' => 'company_email', 'value' => 'billing@apexsolutions.com', 'type' => 'string'],
            ['key' => 'tax_number', 'value' => 'BIN-9876543210', 'type' => 'string'],
            ['key' => 'currency_symbol', 'value' => '৳', 'type' => 'string'],
            ['key' => 'invoice_terms', 'value' => '1. Goods once sold can be exchanged within 7 days with invoice copy.\n2. Payment is due upon receipt or within negotiated credit terms.\n3. Thank you for shopping with us!', 'type' => 'string'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
