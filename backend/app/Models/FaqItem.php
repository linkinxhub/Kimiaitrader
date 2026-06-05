<?php

namespace App\Models;

class FaqItem extends BaseModel
{
    protected $casts = [
        'is_active' => 'boolean',
    ];
}
