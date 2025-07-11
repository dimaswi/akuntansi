<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'description',
        'parent_id',
        'category_type',
        'is_active',
        'requires_batch_tracking',
        'requires_expiry_tracking',
        'storage_requirements',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'requires_batch_tracking' => 'boolean',
        'requires_expiry_tracking' => 'boolean',
        'storage_requirements' => 'array',
    ];

    // Relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(InventoryCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(InventoryCategory::class, 'parent_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InventoryItem::class, 'category_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopePharmacy($query)
    {
        return $query->where('category_type', 'pharmacy');
    }

    public function scopeGeneral($query)
    {
        return $query->where('category_type', 'general');
    }

    public function scopeParentCategories($query)
    {
        return $query->whereNull('parent_id');
    }

    // Accessors
    public function getFullNameAttribute(): string
    {
        if ($this->parent) {
            return $this->parent->name . ' > ' . $this->name;
        }
        return $this->name;
    }

    // Helper Methods
    public function isPharmacy(): bool
    {
        return $this->category_type === 'pharmacy';
    }

    public function isGeneral(): bool
    {
        return $this->category_type === 'general';
    }

    public function hasChildren(): bool
    {
        return $this->children()->count() > 0;
    }

    public function getAllDescendants(): \Illuminate\Support\Collection
    {
        $descendants = collect();
        
        foreach ($this->children as $child) {
            $descendants->push($child);
            $descendants = $descendants->merge($child->getAllDescendants());
        }
        
        return $descendants;
    }
}
