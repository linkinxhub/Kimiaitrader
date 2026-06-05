<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Modules\DynamicModuleService;
use App\Support\ModuleRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DynamicModuleController extends Controller
{
    public function __construct(
        private readonly DynamicModuleService $service,
        private readonly ModuleRegistry $registry,
    ) {
    }

    public function index(Request $request, string $module): JsonResponse
    {
        $definition = $this->registry->resolve($module);
        $this->authorizeModule($request, $definition['permission']);

        return response()->json($this->service->list($module, $request));
    }

    public function store(Request $request, string $module): JsonResponse
    {
        $definition = $this->registry->resolve($module);
        $this->authorizeModule($request, $definition['permission']);

        return response()->json($this->service->store($module, $this->validatePayload($request, $definition['fields'])), 201);
    }

    public function show(Request $request, string $module, int|string $id): JsonResponse
    {
        $definition = $this->registry->resolve($module);
        $this->authorizeModule($request, $definition['permission']);
        $modelClass = $definition['model'];

        return response()->json($modelClass::query()->findOrFail($id));
    }

    public function update(Request $request, string $module, int|string $id): JsonResponse
    {
        $definition = $this->registry->resolve($module);
        $this->authorizeModule($request, $definition['permission']);

        return response()->json($this->service->update($module, $id, $this->validatePayload($request, $definition['fields'])));
    }

    public function destroy(Request $request, string $module, int|string $id): JsonResponse
    {
        $definition = $this->registry->resolve($module);
        $this->authorizeModule($request, $definition['permission']);
        $this->service->destroy($module, $id);

        return response()->json(['message' => 'Record deleted']);
    }

    private function authorizeModule(Request $request, string $permission): void
    {
        abort_unless($request->user()?->can($permission), 403);
    }

    private function validatePayload(Request $request, array $fields): array
    {
        $rules = ['custom_fields' => ['nullable', 'array']];

        foreach ($fields as $field) {
            $rules[$field] = ['nullable'];
        }

        $validated = $request->validate($rules);

        if (! array_filter($validated, fn ($value, $key) => $key !== 'custom_fields' && $value !== null, ARRAY_FILTER_USE_BOTH)
            && empty($validated['custom_fields'])) {
            throw ValidationException::withMessages([
                'payload' => 'At least one field must be provided.',
            ]);
        }

        return $validated;
    }
}
