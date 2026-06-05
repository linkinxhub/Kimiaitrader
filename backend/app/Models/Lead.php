<?php

namespace App\Models;

class Lead extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
    ];
}
