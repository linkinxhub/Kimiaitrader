<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dashboard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            abort_unless($request->user()?->can('manage dashboards'), 403);

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        return response()->json(Dashboard::query()->with('widgets')->latest()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json($this->syncDashboard(new Dashboard(), $request), 201);
    }

    public function show(Dashboard $dashboard): JsonResponse
    {
        return response()->json($dashboard->load('widgets'));
    }

    public function update(Request $request, Dashboard $dashboard): JsonResponse
    {
        return response()->json($this->syncDashboard($dashboard, $request));
    }

    public function destroy(Dashboard $dashboard): JsonResponse
    {
        $dashboard->delete();

        return response()->json(['message' => 'Dashboard deleted']);
    }

    private function syncDashboard(Dashboard $dashboard, Request $request): Dashboard
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255'],
            'filters' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'is_default' => ['boolean'],
            'widgets' => ['array'],
            'widgets.*.key' => ['required', 'string'],
            'widgets.*.title' => ['required', 'string'],
            'widgets.*.type' => ['required', 'string'],
            'widgets.*.metric' => ['nullable', 'string'],
            'widgets.*.config' => ['nullable', 'array'],
            'widgets.*.layout' => ['nullable', 'array'],
            'widgets.*.sort_order' => ['nullable', 'integer'],
            'widgets.*.is_active' => ['boolean'],
        ]);

        return DB::transaction(function () use ($dashboard, $validated): Dashboard {
            if ($validated['is_default'] ?? false) {
                Dashboard::query()->update(['is_default' => false]);
            }

            $dashboard->fill([
                'name' => $validated['name'],
                'code' => $validated['code'],
                'filters' => $validated['filters'] ?? [],
                'settings' => $validated['settings'] ?? [],
                'is_default' => $validated['is_default'] ?? false,
            ]);
            $dashboard->save();

            $widgets = collect($validated['widgets'] ?? []);
            $incomingIds = $widgets->pluck('id')->filter()->all();
            $dashboard->widgets()->whereNotIn('id', $incomingIds ?: [0])->delete();

            $widgets->values()->each(function (array $widget, int $index) use ($dashboard): void {
                $dashboard->widgets()->updateOrCreate(
                    ['id' => $widget['id'] ?? null],
                    [
                        'key' => $widget['key'],
                        'title' => $widget['title'],
                        'type' => $widget['type'],
                        'metric' => $widget['metric'] ?? null,
                        'config' => $widget['config'] ?? [],
                        'layout' => $widget['layout'] ?? [],
                        'sort_order' => $widget['sort_order'] ?? $index + 1,
                        'is_active' => $widget['is_active'] ?? true,
                    ]
                );
            });

            return $dashboard->fresh('widgets');
        });
    }
}
