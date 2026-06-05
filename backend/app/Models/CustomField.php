<?php

namespace App\Models;

class CustomField extends BaseModel
{
    protected $casts = [
        'options' => 'array',
        'validation_rules' => 'array',
        'ui' => 'array',
        'is_active' => 'boolean',
    ];
}
