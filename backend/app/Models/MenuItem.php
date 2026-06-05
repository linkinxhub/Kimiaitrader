<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItem extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
        'is_active' => 'boolean',
    ];

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }
}
