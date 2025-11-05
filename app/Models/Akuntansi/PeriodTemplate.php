<?php

namespace App\Models\Akuntansi;

use Illuminate\Database\Eloquent\Model;

class PeriodTemplate extends Model
{
    protected $table = 'period_templates';

    protected $fillable = [
        'template_name',
        'period_type',
        'cutoff_days',
        'hard_close_days',
        'required_checklists',
        'is_active',
        'is_default',
        'description',
    ];

    protected $casts = [
        'cutoff_days' => 'integer',
        'hard_close_days' => 'integer',
        'required_checklists' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
    ];

    // Scope untuk active templates
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Get default template
    public static function getDefault()
    {
        return self::where('is_default', true)->first();
    }

    // Get template by period type
    public static function getByType(string $type)
    {
        return self::active()->where('period_type', $type)->first();
    }
}
