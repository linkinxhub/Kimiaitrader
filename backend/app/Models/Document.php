<?php

namespace App\Models;

class Document extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
    ];
}
