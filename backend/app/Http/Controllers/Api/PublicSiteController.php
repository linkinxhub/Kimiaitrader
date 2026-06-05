<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Testimonial;
use App\Models\Theme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicSiteController extends Controller
{
    public function bootstrap(): JsonResponse
    {
        return response()->json([
            'theme' => Theme::query()->where('is_active', true)->first(),
            'menus' => Menu::query()->where('is_public', true)->with('items')->get(),
            'settings' => Setting::query()->where('is_public', true)->get()->groupBy('group'),
            'services' => Service::query()->where('status', 'published')->orderBy('published_at', 'desc')->get(),
            'testimonials' => Testimonial::query()->where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function resolve(Request $request): JsonResponse
    {
        $path = trim($request->string('path', '/')->toString(), '/');
        $path = $path === '' ? '/' : '/' . $path;

        $page = Page::query()
            ->with('sections')
            ->where('status', 'published')
            ->where(function ($query) use ($path): void {
                $query->where('path', $path)
                    ->orWhere('slug', trim($path, '/'));
            })
            ->firstOrFail();

        return response()->json($page);
    }
}
