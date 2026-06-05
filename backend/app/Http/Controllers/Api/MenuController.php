<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            abort_unless($request->user()?->can('manage menus'), 403);

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        return response()->json(Menu::query()->with('items')->latest()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        return response()->json($this->syncMenu(new Menu(), $request), 201);
    }

    public function show(Menu $menu): JsonResponse
    {
        return response()->json($menu->load('items'));
    }

    public function update(Request $request, Menu $menu): JsonResponse
    {
        return response()->json($this->syncMenu($menu, $request));
    }

    public function destroy(Menu $menu): JsonResponse
    {
        $menu->delete();

        return response()->json(['message' => 'Menu deleted']);
    }

    private function syncMenu(Menu $menu, Request $request): Menu
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'settings' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'is_public' => ['boolean'],
            'items' => ['array'],
            'items.*.label' => ['required', 'string'],
            'items.*.type' => ['required', 'string'],
            'items.*.url' => ['nullable', 'string'],
            'items.*.page_id' => ['nullable', 'integer'],
            'items.*.parent_id' => ['nullable', 'integer'],
            'items.*.target' => ['nullable', 'string'],
            'items.*.icon' => ['nullable', 'string'],
            'items.*.sort_order' => ['nullable', 'integer'],
            'items.*.meta' => ['nullable', 'array'],
            'items.*.is_active' => ['boolean'],
        ]);

        return DB::transaction(function () use ($menu, $validated): Menu {
            $menu->fill([
                'name' => $validated['name'],
                'code' => $validated['code'],
                'location' => $validated['location'] ?? null,
                'settings' => $validated['settings'] ?? [],
                'is_active' => $validated['is_active'] ?? true,
                'is_public' => $validated['is_public'] ?? true,
            ]);
            $menu->save();

            $items = collect($validated['items'] ?? []);
            $incomingIds = $items->pluck('id')->filter()->all();
            $menu->items()->whereNotIn('id', $incomingIds ?: [0])->delete();

            $items->values()->each(function (array $item, int $index) use ($menu): void {
                $menu->items()->updateOrCreate(
                    ['id' => $item['id'] ?? null],
                    [
                        'label' => $item['label'],
                        'type' => $item['type'],
                        'url' => $item['url'] ?? null,
                        'page_id' => $item['page_id'] ?? null,
                        'parent_id' => $item['parent_id'] ?? null,
                        'target' => $item['target'] ?? '_self',
                        'icon' => $item['icon'] ?? null,
                        'sort_order' => $item['sort_order'] ?? $index + 1,
                        'meta' => $item['meta'] ?? [],
                        'is_active' => $item['is_active'] ?? true,
                    ]
                );
            });

            return $menu->fresh('items');
        });
    }
}
