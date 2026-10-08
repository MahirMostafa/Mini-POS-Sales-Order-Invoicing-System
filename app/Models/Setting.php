<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'type',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        return match ($setting->type) {
            'integer', 'int' => (int) $setting->value,
            'boolean', 'bool' => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($setting->value, true),
            'decimal', 'float' => (float) $setting->value,
            default => $setting->value,
        };
    }

    public static function set(string $key, mixed $value, string $type = 'string'): void
    {
        $val = is_array($value) ? json_encode($value) : (string) $value;
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $val, 'type' => $type]
        );
    }
}
