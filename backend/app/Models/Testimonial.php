<?php

namespace App\Models;

class Testimonial extends BaseModel
{
    protected $casts = [
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
    ];
}
