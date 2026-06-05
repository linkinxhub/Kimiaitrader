<?php

namespace App\Services\Cms;

use App\Models\Form;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class FormBuilderService
{
    public function sync(Form $form, array $payload): Form
    {
        return DB::transaction(function () use ($form, $payload): Form {
            $form->fill(Arr::only($payload, [
                'name',
                'slug',
                'description',
                'submit_label',
                'success_message',
                'settings',
                'notifications',
                'is_active',
            ]));
            $form->save();

            $fields = collect($payload['fields'] ?? []);
            $incomingIds = $fields->pluck('id')->filter()->all();
            $form->fields()->whereNotIn('id', $incomingIds ?: [0])->delete();

            $fields->values()->each(function (array $field, int $index) use ($form): void {
                $form->fields()->updateOrCreate(
                    ['id' => $field['id'] ?? null],
                    [
                        'name' => $field['name'],
                        'label' => $field['label'] ?? ucfirst($field['name']),
                        'type' => $field['type'] ?? 'text',
                        'placeholder' => $field['placeholder'] ?? null,
                        'default_value' => $field['default_value'] ?? null,
                        'help_text' => $field['help_text'] ?? null,
                        'options' => $field['options'] ?? [],
                        'validation_rules' => $field['validation_rules'] ?? [],
                        'ui' => $field['ui'] ?? [],
                        'width' => $field['width'] ?? 'full',
                        'sort_order' => $field['sort_order'] ?? $index + 1,
                        'is_required' => (bool) ($field['is_required'] ?? false),
                    ]
                );
            });

            return $form->fresh('fields', 'submissions');
        });
    }
}
