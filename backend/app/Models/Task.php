<?php

namespace App\Models;

class Task extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
        'starts_at' => 'datetime',
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}
