<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardWidget extends BaseModel
{
    protected $casts = [
        'config' => 'array',
        'layout' => 'array',
        'is_active' => 'boolean',
    ];

    public function dashboard(): BelongsTo
    {
        return $this->belongsTo(Dashboard::class);
    }
}
