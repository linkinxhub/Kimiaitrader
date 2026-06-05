<?php

namespace App\Models;

class Theme extends BaseModel
{
    protected $casts = [
        'palette' => 'array',
        'typography' => 'array',
        'surfaces' => 'array',
        'effects' => 'array',
        'is_active' => 'boolean',
    ];
}
