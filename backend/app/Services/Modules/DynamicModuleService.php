<?php

namespace App\Services\Modules;

use App\Models\CustomField;
use App\Models\CustomFieldValue;
use App\Support\ModuleRegistry;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class DynamicModuleService
{
    public function __construct(private readonly ModuleRegistry $registry)
    {
    }

    public function list(string $module, Request $request): LengthAwarePaginator
    {
        $definition = $this->registry->resolve($module);
        $modelClass = $definition['model'];
        $query = $modelClass::query();

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($builder) use ($definition, $search): void {
                foreach ($definition['search'] ?? [] as $column) {
                    $builder->orWhere($column, 'like', '%' . $search . '%');
                }
            });
        }

        $sort = $request->string('sort', 'created_at')->toString();
        $direction = $request->string('direction', 'desc')->toString();
        $query->orderBy($sort, $direction === 'asc' ? 'asc' : 'desc');

        return $query->paginate((int) $request->integer('per_page', 15));
    }

    public function store(string $module, array $payload): Model
    {
        return DB::transaction(function () use ($module, $payload): Model {
            $definition = $this->registry->resolve($module);
            $modelClass = $definition['model'];
            $model = new $modelClass();
            $model->fill(Arr::only($payload, $definition['fields']));
            $model->save();
            $this->syncCustomFields($module, $model->id, $payload['custom_fields'] ?? []);

            return $model->fresh();
        });
    }

    public function update(string $module, int|string $id, array $payload): Model
    {
        return DB::transaction(function () use ($module, $id, $payload): Model {
            $definition = $this->registry->resolve($module);
            $modelClass = $definition['model'];
            $model = $modelClass::query()->findOrFail($id);
            $model->fill(Arr::only($payload, $definition['fields']));
            $model->save();
            $this->syncCustomFields($module, $model->id, $payload['custom_fields'] ?? []);

            return $model->fresh();
        });
    }

    public function destroy(string $module, int|string $id): void
    {
        $definition = $this->registry->resolve($module);
        $modelClass = $definition['model'];
        $model = $modelClass::query()->findOrFail($id);
        $model->delete();

        CustomFieldValue::query()
            ->where('entity_type', $module)
            ->where('entity_id', $id)
            ->delete();
    }

    private function syncCustomFields(string $module, int|string $entityId, array $values): void
    {
        if (! $values) {
            return;
        }

        $fields = CustomField::query()
            ->where('entity_type', $module)
            ->where('is_active', true)
            ->get()
            ->keyBy('name');

        foreach ($values as $fieldName => $value) {
            $field = $fields->get($fieldName);

            if (! $field) {
                continue;
            }

            CustomFieldValue::query()->updateOrCreate(
                [
                    'custom_field_id' => $field->id,
                    'entity_type' => $module,
                    'entity_id' => $entityId,
                ],
                [
                    'value' => $value,
                ]
            );
        }
    }
}
