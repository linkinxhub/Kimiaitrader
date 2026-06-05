<?php

namespace App\Models;

class CustomFieldValue extends BaseModel
{
    protected $casts = [
        'value' => 'array',
    ];
}
