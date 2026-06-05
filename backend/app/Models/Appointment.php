<?php

namespace App\Models;

class Appointment extends BaseModel
{
    protected $casts = [
        'meta' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];
}
