<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Form;
use App\Models\FormSubmission;
use App\Services\Cms\FormBuilderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FormController extends Controller
{
    public function __construct(private readonly FormBuilderService $builder)
    {
        $this->middleware(function ($request, $next) {
            if ($request->is('api/public/*')) {
                return $next($request);
            }

            abort_unless($request->user()?->can('manage forms'), 403);

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        return response()->json(Form::query()->with('fields')->latest()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json($this->builder->sync(new Form(), $this->validateFormPayload($request)), 201);
    }

    public function update(Request $request, Form $form): JsonResponse
    {
        return response()->json($this->builder->sync($form, $this->validateFormPayload($request)));
    }

    public function destroy(Form $form): JsonResponse
    {
        $form->delete();

        return response()->json(['message' => 'Form deleted']);
    }

    public function showPublic(string $slug): JsonResponse
    {
        return response()->json(
            Form::query()->where('slug', $slug)->where('is_active', true)->with('fields')->firstOrFail()
        );
    }

    public function submit(Request $request, string $slug): JsonResponse
    {
        $form = Form::query()->where('slug', $slug)->where('is_active', true)->with('fields')->firstOrFail();
        $rules = [];

        foreach ($form->fields as $field) {
            $fieldRules = $field->validation_rules ?: [];

            if ($field->is_required && ! in_array('required', $fieldRules, true)) {
                array_unshift($fieldRules, 'required');
            }

            $rules[$field->name] = $fieldRules ?: ['nullable'];
        }

        $payload = $request->validate($rules);
        $submission = FormSubmission::query()->create([
            'form_id' => $form->id,
            'payload' => $payload,
            'meta' => [
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'submitted_at' => now()->toIso8601String(),
            ],
            'status' => 'received',
        ]);

        return response()->json([
            'message' => $form->success_message ?: 'Submission received',
            'submission' => $submission,
        ], 201);
    }

    private function validateFormPayload(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'submit_label' => ['nullable', 'string', 'max:100'],
            'success_message' => ['nullable', 'string'],
            'settings' => ['nullable', 'array'],
            'notifications' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'fields' => ['array'],
            'fields.*.name' => ['required', 'string', 'max:255'],
            'fields.*.label' => ['nullable', 'string', 'max:255'],
            'fields.*.type' => ['required', Rule::in(['text', 'email', 'phone', 'textarea', 'select', 'radio', 'checkbox', 'number', 'date'])],
            'fields.*.placeholder' => ['nullable', 'string'],
            'fields.*.default_value' => ['nullable'],
            'fields.*.help_text' => ['nullable', 'string'],
            'fields.*.options' => ['nullable', 'array'],
            'fields.*.validation_rules' => ['nullable', 'array'],
            'fields.*.ui' => ['nullable', 'array'],
            'fields.*.width' => ['nullable', 'string'],
            'fields.*.sort_order' => ['nullable', 'integer'],
            'fields.*.is_required' => ['boolean'],
        ]);
    }
}
