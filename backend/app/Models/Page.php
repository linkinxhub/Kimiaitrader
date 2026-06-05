<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends BaseModel
{
    protected $casts = [
        'seo' => 'array',
        'hero' => 'array',
        'settings' => 'array',
        'published_at' => 'datetime',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(PageSection::class)->orderBy('sort_order');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(PageRevision::class)->latest();
    }
}
