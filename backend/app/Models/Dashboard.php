<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Dashboard extends BaseModel
{
    protected $casts = [
        'filters' => 'array',
        'settings' => 'array',
        'is_default' => 'boolean',
    ];

    public function widgets(): HasMany
    {
        return $this->hasMany(DashboardWidget::class)->orderBy('sort_order');
    }
}
