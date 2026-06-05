<?php

namespace App\Models;

class FeatureModule extends BaseModel
{
    protected $casts = [
        'config' => 'array',
        'is_active' => 'boolean',
        'is_locked' => 'boolean',
    ];
}
