<?php

use App\Models\Appointment;
use App\Models\BlogPost;
use App\Models\Block;
use App\Models\Client;
use App\Models\Document;
use App\Models\FaqItem;
use App\Models\FeatureModule;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Report;
use App\Models\Service;
use App\Models\Task;
use App\Models\Testimonial;

return [
    'builders' => [
        'page-components' => [
            ['key' => 'hero', 'label' => 'Hero Banner'],
            ['key' => 'rich-text', 'label' => 'Rich Text'],
            ['key' => 'feature-grid', 'label' => 'Feature Grid'],
            ['key' => 'service-grid', 'label' => 'Services Grid'],
            ['key' => 'testimonials', 'label' => 'Testimonials'],
            ['key' => 'stats', 'label' => 'Stats'],
            ['key' => 'cta', 'label' => 'CTA'],
            ['key' => 'form-embed', 'label' => 'Form Embed'],
        ],
        'dashboard-widgets' => [
            ['key' => 'metric-card', 'label' => 'Metric Card'],
            ['key' => 'activity-feed', 'label' => 'Activity Feed'],
            ['key' => 'pipeline', 'label' => 'Lead Pipeline'],
            ['key' => 'calendar', 'label' => 'Appointments Calendar'],
            ['key' => 'table', 'label' => 'Table'],
        ],
    ],
    'permissions' => [
        'access admin',
        'manage cms',
        'manage forms',
        'manage menus',
        'manage settings',
        'manage themes',
        'manage dashboards',
        'manage modules',
        'manage roles',
        'manage custom fields',
        'view reports',
        'manage services',
        'manage clients',
        'manage leads',
        'manage appointments',
        'manage invoices',
        'manage tasks',
        'manage documents',
        'manage blog',
        'manage faq',
        'manage testimonials',
        'manage feature modules',
    ],
    'modules' => [
        'services' => [
            'label' => 'Services',
            'model' => Service::class,
            'permission' => 'manage services',
            'search' => ['name', 'slug', 'summary'],
            'fields' => ['name', 'slug', 'summary', 'body', 'status', 'price_label', 'meta', 'published_at'],
        ],
        'clients' => [
            'label' => 'Clients',
            'model' => Client::class,
            'permission' => 'manage clients',
            'search' => ['company_name', 'contact_name', 'email'],
            'fields' => ['company_name', 'contact_name', 'email', 'phone', 'status', 'industry', 'address', 'meta'],
        ],
        'leads' => [
            'label' => 'Leads',
            'model' => Lead::class,
            'permission' => 'manage leads',
            'search' => ['name', 'email', 'source', 'company'],
            'fields' => ['name', 'email', 'phone', 'company', 'source', 'status', 'score', 'estimated_value', 'notes', 'meta'],
        ],
        'appointments' => [
            'label' => 'Appointments',
            'model' => Appointment::class,
            'permission' => 'manage appointments',
            'search' => ['title', 'location', 'status'],
            'fields' => ['client_id', 'lead_id', 'assigned_to', 'title', 'status', 'location', 'starts_at', 'ends_at', 'notes', 'meta'],
        ],
        'invoices' => [
            'label' => 'Invoices',
            'model' => Invoice::class,
            'permission' => 'manage invoices',
            'search' => ['number', 'status', 'currency'],
            'fields' => ['client_id', 'number', 'status', 'currency', 'subtotal', 'tax_total', 'grand_total', 'line_items', 'issued_at', 'due_at', 'paid_at', 'meta'],
        ],
        'tasks' => [
            'label' => 'Tasks',
            'model' => Task::class,
            'permission' => 'manage tasks',
            'search' => ['title', 'status', 'priority'],
            'fields' => ['assigned_to', 'related_type', 'related_id', 'title', 'description', 'status', 'priority', 'starts_at', 'due_at', 'completed_at', 'meta'],
        ],
        'documents' => [
            'label' => 'Documents',
            'model' => Document::class,
            'permission' => 'manage documents',
            'search' => ['title', 'document_type', 'visibility'],
            'fields' => ['client_id', 'title', 'document_type', 'path', 'mime_type', 'visibility', 'meta'],
        ],
        'blog-posts' => [
            'label' => 'Blog',
            'model' => BlogPost::class,
            'permission' => 'manage blog',
            'search' => ['title', 'slug', 'excerpt'],
            'fields' => ['title', 'slug', 'excerpt', 'content', 'cover_image', 'status', 'seo', 'published_at', 'author_id'],
        ],
        'faq-items' => [
            'label' => 'FAQ',
            'model' => FaqItem::class,
            'permission' => 'manage faq',
            'search' => ['question', 'answer', 'category'],
            'fields' => ['category', 'question', 'answer', 'sort_order', 'is_active'],
        ],
        'testimonials' => [
            'label' => 'Testimonials',
            'model' => Testimonial::class,
            'permission' => 'manage testimonials',
            'search' => ['name', 'company', 'quote'],
            'fields' => ['name', 'company', 'role', 'quote', 'rating', 'avatar', 'sort_order', 'is_featured', 'is_active'],
        ],
        'reports' => [
            'label' => 'Reports',
            'model' => Report::class,
            'permission' => 'view reports',
            'search' => ['name', 'code', 'source'],
            'fields' => ['name', 'code', 'source', 'filters', 'layout', 'visibility', 'is_active'],
        ],
        'blocks' => [
            'label' => 'Blocks',
            'model' => Block::class,
            'permission' => 'manage cms',
            'search' => ['name', 'key', 'category'],
            'fields' => ['name', 'key', 'category', 'schema', 'preview', 'is_system', 'is_active'],
        ],
        'feature-modules' => [
            'label' => 'Feature Modules',
            'model' => FeatureModule::class,
            'permission' => 'manage feature modules',
            'search' => ['name', 'code', 'description'],
            'fields' => ['name', 'code', 'description', 'category', 'config', 'is_active', 'is_locked'],
        ],
    ],
];
