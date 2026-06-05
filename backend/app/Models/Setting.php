<?php

namespace App\Models;

class Setting extends BaseModel
{
    protected $casts = [
        'value' => 'array',
        'ui' => 'array',
        'is_public' => 'boolean',
        'is_system' => 'boolean',
    ];
}
