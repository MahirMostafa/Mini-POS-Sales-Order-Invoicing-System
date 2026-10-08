<?php

namespace App\Contracts\Repositories;

interface SettingRepositoryInterface
{
    public function get(string $key, mixed $default = null): mixed;
    public function set(string $key, mixed $value, string $type = 'string'): bool;
    public function getCompanyInfo(): array;
    public function getCurrencySymbol(): string;
}
