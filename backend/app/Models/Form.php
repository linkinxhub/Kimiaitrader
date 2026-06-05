<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Form extends BaseModel
{
    protected $casts = [
        'settings' => 'array',
        'notifications' => 'array',
        'is_active' => 'boolean',
    ];

    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class)->orderBy('sort_order');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(FormSubmission::class)->latest();
    }
}
