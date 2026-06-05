<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageRevision extends BaseModel
{
    protected $casts = [
        'snapshot' => 'array',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
