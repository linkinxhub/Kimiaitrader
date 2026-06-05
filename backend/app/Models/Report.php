<?php

namespace App\Models;

class Report extends BaseModel
{
    protected $casts = [
        'filters' => 'array',
        'layout' => 'array',
        'is_active' => 'boolean',
    ];
}
