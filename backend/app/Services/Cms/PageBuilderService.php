<?php

namespace App\Services\Cms;

use App\Models\Page;
use App\Models\PageRevision;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class PageBuilderService
{
    public function sync(Page $page, array $payload): Page
    {
        return DB::transaction(function () use ($page, $payload): Page {
            $page->fill(Arr::only($payload, [
                'title',
                'slug',
                'path',
                'status',
                'template',
                'seo',
                'hero',
                'settings',
                'published_at',
            ]));
            $page->save();

            $sections = collect($payload['sections'] ?? []);
            $incomingIds = $sections->pluck('id')->filter()->all();
            $page->sections()->whereNotIn('id', $incomingIds ?: [0])->delete();

            $sections->values()->each(function (array $section, int $index) use ($page): void {
                $page->sections()->updateOrCreate(
                    ['id' => $section['id'] ?? null],
                    [
                        'parent_id' => $section['parent_id'] ?? null,
                        'block_id' => $section['block_id'] ?? null,
                        'name' => $section['name'] ?? $section['component'],
                        'component' => $section['component'],
                        'sort_order' => $section['sort_order'] ?? $index + 1,
                        'props' => $section['props'] ?? [],
                        'content' => $section['content'] ?? [],
                        'styles' => $section['styles'] ?? [],
                        'layout' => $section['layout'] ?? [],
                        'visibility_rules' => $section['visibility_rules'] ?? [],
                    ]
                );
            });

            PageRevision::query()->create([
                'page_id' => $page->id,
                'snapshot' => [
                    'page' => $page->fresh()->toArray(),
                    'sections' => $page->sections()->get()->toArray(),
                ],
                'created_by' => auth()->id(),
            ]);

            return $page->fresh('sections', 'revisions');
        });
    }
}
