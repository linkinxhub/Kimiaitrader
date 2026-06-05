<?php

namespace App\Models;

class Block extends BaseModel
{
    protected $casts = [
        'schema' => 'array',
        'preview' => 'array',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
    ];
}
