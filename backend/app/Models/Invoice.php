<?php

namespace App\Models;

class Invoice extends BaseModel
{
    protected $casts = [
        'line_items' => 'array',
        'meta' => 'array',
        'issued_at' => 'datetime',
        'due_at' => 'datetime',
        'paid_at' => 'datetime',
    ];
}
