<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormSubmission extends BaseModel
{
    protected $casts = [
        'payload' => 'array',
        'meta' => 'array',
    ];

    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }
}
