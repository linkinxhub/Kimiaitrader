<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ThemeController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            abort_unless($request->user()?->can('manage themes'), 403);

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        return response()->json(Theme::query()->orderByDesc('is_active')->orderBy('name')->get());
    }

    public function update(Request $request, Theme $theme): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255'],
            'palette' => ['required', 'array'],
            'typography' => ['required', 'array'],
            'surfaces' => ['required', 'array'],
            'effects' => ['required', 'array'],
            'is_active' => ['boolean'],
        ]);

        $theme->update($validated);

        return response()->json($theme);
    }

    public function activate(Theme $theme): JsonResponse
    {
        DB::transaction(function () use ($theme): void {
            Theme::query()->update(['is_active' => false]);
            $theme->update(['is_active' => true]);
        });

        return response()->json($theme->fresh());
    }
}
