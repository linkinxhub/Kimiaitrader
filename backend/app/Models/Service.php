<?php

namespace App\Models;

class Service extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
        'published_at' => 'datetime',
    ];
}
