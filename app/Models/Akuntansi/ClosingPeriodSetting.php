<?php

namespace App\Models\Akuntansi;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ClosingPeriodSetting extends Model
{
    protected $table = 'closing_period_settings';

    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
        'group',
    ];

    /**
     * Get setting value by key (dengan cache)
     */
    public static function get(string $key, $default = null)
    {
        return Cache::remember("closing_setting_{$key}", 3600, function () use ($key, $default) {
            $setting = self::where('key', $key)->first();
            
            if (!$setting) {
                return $default;
            }

            return self::castValue($setting->value, $setting->type);
        });
    }

    /**
     * Set setting value by key
     */
    public static function set(string $key, $value): bool
    {
        $setting = self::where('key', $key)->first();
        
        if (!$setting) {
            return false;
        }

        $stringValue = is_bool($value) ? ($value ? 'true' : 'false') : (string) $value;
        
        $setting->update(['value' => $stringValue]);
        
        // Clear cache
        Cache::forget("closing_setting_{$key}");
        
        return true;
    }

    /**
     * Cast value berdasarkan type
     */
    protected static function castValue($value, $type)
    {
        return match($type) {
            'boolean' => $value === 'true' || $value === '1' || $value === 1,
            'integer' => (int) $value,
            'date' => \Carbon\Carbon::parse($value),
            default => $value,
        };
    }

    /**
     * Get all settings by group
     */
    public static function getByGroup(string $group): array
    {
        return Cache::remember("closing_settings_group_{$group}", 3600, function () use ($group) {
            $settings = self::where('group', $group)->get();
            
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting->key] = self::castValue($setting->value, $setting->type);
            }
            
            return $result;
        });
    }

    /**
     * Check apakah module enabled
     */
    public static function isModuleEnabled(): bool
    {
        return self::get('closing_module_enabled', false);
    }

    /**
     * Get closing mode
     */
    public static function getClosingMode(): string
    {
        return self::get('closing_mode', 'disabled');
    }

    /**
     * Clear all settings cache
     */
    public static function clearCache(): void
    {
        $keys = self::pluck('key');
        foreach ($keys as $key) {
            Cache::forget("closing_setting_{$key}");
        }
        
        $groups = self::distinct('group')->pluck('group');
        foreach ($groups as $group) {
            Cache::forget("closing_settings_group_{$group}");
        }
    }
}
