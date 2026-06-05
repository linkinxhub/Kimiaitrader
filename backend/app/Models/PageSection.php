<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageSection extends BaseModel
{
    protected $casts = [
        'props' => 'array',
        'content' => 'array',
        'styles' => 'array',
        'layout' => 'array',
        'visibility_rules' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
