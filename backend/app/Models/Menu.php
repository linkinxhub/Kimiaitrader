<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends BaseModel
{
    protected $casts = [
        'settings' => 'array',
        'is_active' => 'boolean',
        'is_public' => 'boolean',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort_order');
    }
}
