<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomersSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'customer_code' => 'CUST-0001',
                'name' => 'Walk-in / Cash Customer',
                'email' => 'walkin@store.local',
                'phone' => '01700000000',
                'address' => 'Over The Counter, POS Desk',
                'tax_number' => null,
                'credit_balance' => 0.00,
                'is_active' => true,
            ],
            [
                'customer_code' => 'CUST-0002',
                'name' => 'Rahim Enterprise Ltd',
                'email' => 'rahim@enterprise.com',
                'phone' => '01711223344',
                'address' => 'Plot 12, Mohakhali C/A, Dhaka',
                'tax_number' => 'BIN-554433221',
                'credit_balance' => 0.00,
                'is_active' => true,
            ],
            [
                'customer_code' => 'CUST-0003',
                'name' => 'Nexus IT Solutions',
                'email' => 'accounts@nexusbd.com',
                'phone' => '01822334455',
                'address' => 'Road 27, Banani, Dhaka',
                'tax_number' => 'BIN-889900112',
                'credit_balance' => 0.00,
                'is_active' => true,
            ],
            [
                'customer_code' => 'CUST-0004',
                'name' => 'Dr. Farhana Ahmed',
                'email' => 'farhana.ahmed@gmail.com',
                'phone' => '01933445566',
                'address' => 'House 5, Dhanmondi 9/A, Dhaka',
                'tax_number' => null,
                'credit_balance' => 0.00,
                'is_active' => true,
            ],
            [
                'customer_code' => 'CUST-0005',
                'name' => 'Green Valley Departmental Store',
                'email' => 'orders@greenvalley.com',
                'phone' => '01644556677',
                'address' => 'Sector 4, Uttara, Dhaka',
                'tax_number' => 'BIN-776655443',
                'credit_balance' => 0.00,
                'is_active' => true,
            ],
        ];

        foreach ($customers as $customer) {
            Customer::firstOrCreate(
                ['customer_code' => $customer['customer_code']],
                $customer
            );
        }
    }
}
