<?php

namespace App\Models;

class BlogPost extends BaseModel
{
    protected $casts = [
        'seo' => 'array',
        'published_at' => 'datetime',
    ];
}
