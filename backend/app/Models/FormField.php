<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormField extends BaseModel
{
    protected $casts = [
        'options' => 'array',
        'validation_rules' => 'array',
        'ui' => 'array',
        'is_required' => 'boolean',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
