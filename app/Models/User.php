<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'nip',
        'password',
        'role_id',
        'department_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Inventory\Department::class);
    }

    public function hasPermission($permission): bool
    {
        return $this->role?->hasPermission($permission) ?? false;
    }

    public function hasRole($role): bool
    {
        if (is_array($role)) {
            // Check if user's role name is in the array
            return in_array($this->role?->name, $role);
        }
        
        if (is_string($role)) {
            return $this->role?->name === $role;
        }
        
        // If it's an object with id
        return $this->role?->id === $role->id;
    }

    public function hasAnyRole(array $roles): bool
    {
        return $this->hasRole($roles);
    }

    public function getAllPermissions(): array
    {
        return $this->role?->permissions?->pluck('name')->toArray() ?? [];
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('administrator');
    }

    public function isLogistics(): bool
    {
        return $this->hasRole('logistics') || $this->hasRole('administrator');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class)->orderBy('created_at', 'desc');
    }

    public function unreadNotifications()
    {
        return $this->hasMany(Notification::class)->whereNull('read_at')->orderBy('created_at', 'desc');
    }
}
