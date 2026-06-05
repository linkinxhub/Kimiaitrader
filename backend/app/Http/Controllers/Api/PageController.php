<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Services\Cms\PageBuilderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function __construct(private readonly PageBuilderService $builder)
    {
        $this->middleware(function ($request, $next) {
            abort_unless($request->user()?->can('manage cms'), 403);

            return $next($request);
        });
    }

    public function index(): JsonResponse
    {
        return response()->json(Page::query()->with('sections')->latest()->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'path' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string'],
            'template' => ['nullable', 'string'],
            'seo' => ['nullable', 'array'],
            'hero' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'published_at' => ['nullable', 'date'],
            'sections' => ['array'],
        ]);

        return response()->json($this->builder->sync(new Page(), $validated), 201);
    }

    public function show(Page $page): JsonResponse
    {
        return response()->json($page->load('sections', 'revisions'));
    }

    public function update(Request $request, Page $page): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255'],
            'path' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string'],
            'template' => ['nullable', 'string'],
            'seo' => ['nullable', 'array'],
            'hero' => ['nullable', 'array'],
            'settings' => ['nullable', 'array'],
            'published_at' => ['nullable', 'date'],
            'sections' => ['array'],
        ]);

        return response()->json($this->builder->sync($page, $validated));
    }

    public function destroy(Page $page): JsonResponse
    {
        $page->delete();

        return response()->json(['message' => 'Page deleted']);
    }
}
