<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            abort_unless($request->user()?->can('manage settings'), 403);

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        return response()->json(Setting::query()->orderBy('group')->orderBy('key')->get()->groupBy('group'));
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.scope' => ['required', 'string'],
            'settings.*.group' => ['required', 'string'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.label' => ['nullable', 'string'],
            'settings.*.type' => ['required', 'string'],
            'settings.*.value' => ['nullable'],
            'settings.*.ui' => ['nullable', 'array'],
            'settings.*.is_public' => ['boolean'],
            'settings.*.is_system' => ['boolean'],
        ]);

        foreach ($validated['settings'] as $setting) {
            Setting::query()->updateOrCreate(
                [
                    'scope' => $setting['scope'],
                    'group' => $setting['group'],
                    'key' => $setting['key'],
                ],
                [
                    'label' => $setting['label'] ?? ucfirst(str_replace('_', ' ', $setting['key'])),
                    'type' => $setting['type'],
                    'value' => $setting['value'],
                    'ui' => $setting['ui'] ?? [],
                    'is_public' => $setting['is_public'] ?? false,
                    'is_system' => $setting['is_system'] ?? false,
                ]
            );
        }

        return response()->json(['message' => 'Settings updated']);
    }
}
