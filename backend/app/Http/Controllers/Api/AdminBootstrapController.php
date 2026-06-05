<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Dashboard;
use App\Models\FeatureModule;
use App\Models\Menu;
use App\Models\Setting;
use App\Models\Theme;
use App\Support\ModuleRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminBootstrapController extends Controller
{
    public function __construct(private readonly ModuleRegistry $registry)
    {
        $this->middleware(function ($request, $next) {
            abort_unless($request->user()?->can('access admin'), 403);

            return $next($request);
        });
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('roles', 'permissions'),
            'modules' => $this->registry->all(),
            'builders' => $this->registry->builders(),
            'menus' => Menu::query()->with('items')->get(),
            'settings' => Setting::query()->get()->groupBy('group'),
            'theme' => Theme::query()->where('is_active', true)->first(),
            'dashboards' => Dashboard::query()->with('widgets')->get(),
            'feature_modules' => FeatureModule::query()->orderBy('category')->orderBy('name')->get(),
        ]);
    }
}
