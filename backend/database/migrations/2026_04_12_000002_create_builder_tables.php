<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('path')->unique();
            $table->string('status')->default('draft');
            $table->string('template')->nullable();
            $table->json('seo')->nullable();
            $table->json('hero')->nullable();
            $table->json('settings')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        Schema::create('blocks', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('key')->unique();
            $table->string('category')->nullable();
            $table->json('schema')->nullable();
            $table->json('preview')->nullable();
            $table->boolean('is_system')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('page_sections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('page_sections')->nullOnDelete();
            $table->foreignId('block_id')->nullable()->constrained('blocks')->nullOnDelete();
            $table->string('name');
            $table->string('component');
            $table->unsignedInteger('sort_order')->default(1);
            $table->json('props')->nullable();
            $table->json('content')->nullable();
            $table->json('styles')->nullable();
            $table->json('layout')->nullable();
            $table->json('visibility_rules')->nullable();
            $table->timestamps();
        });

        Schema::create('page_revisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('page_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('snapshot');
            $table->timestamps();
        });

        Schema::create('forms', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('submit_label')->default('Send');
            $table->text('success_message')->nullable();
            $table->json('settings')->nullable();
            $table->json('notifications')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('form_fields', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('label');
            $table->string('type')->default('text');
            $table->string('placeholder')->nullable();
            $table->text('default_value')->nullable();
            $table->text('help_text')->nullable();
            $table->json('options')->nullable();
            $table->json('validation_rules')->nullable();
            $table->json('ui')->nullable();
            $table->string('width')->default('full');
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_required')->default(false);
            $table->timestamps();
        });

        Schema::create('form_submissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('form_id')->constrained()->cascadeOnDelete();
            $table->json('payload');
            $table->json('meta')->nullable();
            $table->string('status')->default('received');
            $table->timestamps();
        });

        Schema::create('menus', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('location')->nullable();
            $table->json('settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });

        Schema::create('menu_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('menu_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->nullOnDelete();
            $table->foreignId('page_id')->nullable()->constrained('pages')->nullOnDelete();
            $table->string('label');
            $table->string('type')->default('internal');
            $table->string('url')->nullable();
            $table->string('target')->default('_self');
            $table->string('icon')->nullable();
            $table->unsignedInteger('sort_order')->default(1);
            $table->json('meta')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('scope')->default('global');
            $table->string('group')->default('general');
            $table->string('key');
            $table->string('label')->nullable();
            $table->string('type')->default('text');
            $table->json('value')->nullable();
            $table->json('ui')->nullable();
            $table->boolean('is_public')->default(false);
            $table->boolean('is_system')->default(false);
            $table->timestamps();
            $table->unique(['scope', 'group', 'key']);
        });

        Schema::create('themes', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->json('palette');
            $table->json('typography');
            $table->json('surfaces');
            $table->json('effects');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });

        Schema::create('dashboards', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->json('filters')->nullable();
            $table->json('settings')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('dashboard_widgets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('dashboard_id')->constrained()->cascadeOnDelete();
            $table->string('key');
            $table->string('title');
            $table->string('type');
            $table->string('metric')->nullable();
            $table->json('config')->nullable();
            $table->json('layout')->nullable();
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('feature_modules', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->json('config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
        });

        Schema::create('custom_fields', function (Blueprint $table): void {
            $table->id();
            $table->string('entity_type');
            $table->string('scope')->default('admin');
            $table->string('name');
            $table->string('label');
            $table->string('field_type');
            $table->json('options')->nullable();
            $table->json('validation_rules')->nullable();
            $table->json('ui')->nullable();
            $table->unsignedInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['entity_type', 'name']);
        });

        Schema::create('custom_field_values', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('custom_field_id')->constrained()->cascadeOnDelete();
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id');
            $table->json('value')->nullable();
            $table->timestamps();
            $table->unique(['custom_field_id', 'entity_type', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('custom_field_values');
        Schema::dropIfExists('custom_fields');
        Schema::dropIfExists('feature_modules');
        Schema::dropIfExists('dashboard_widgets');
        Schema::dropIfExists('dashboards');
        Schema::dropIfExists('themes');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('menus');
        Schema::dropIfExists('form_submissions');
        Schema::dropIfExists('form_fields');
        Schema::dropIfExists('forms');
        Schema::dropIfExists('page_revisions');
        Schema::dropIfExists('page_sections');
        Schema::dropIfExists('blocks');
        Schema::dropIfExists('pages');
    }
};
