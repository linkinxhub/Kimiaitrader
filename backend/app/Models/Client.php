<?php

namespace App\Models;

class Client extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
    ];
}
