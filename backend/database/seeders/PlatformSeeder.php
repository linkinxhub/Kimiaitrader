<?php

namespace Database\Seeders;

use App\Models\FeatureModule;
use App\Models\Menu;
use App\Models\Page;
use App\Models\PageSection;
use App\Models\Service;
use App\Models\Setting;
use App\Models\Testimonial;
use App\Models\Theme;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PlatformSeeder extends Seeder
{
    public function run(): void
    {
        foreach (config('platform.permissions', []) as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $adminRole = Role::findOrCreate('super-admin', 'web');
        $adminRole->syncPermissions(Permission::all());

        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ]
        );
        $admin->assignRole($adminRole);

        Theme::query()->updateOrCreate(
            ['code' => 'noctis-gold'],
            [
                'name' => 'Ledger Prestige',
                'palette' => [
                    'background' => '#0a0f1c',
                    'surface' => '#11182b',
                    'surfaceAlt' => '#1a2340',
                    'primary' => '#d4a657',
                    'secondary' => '#72e6c8',
                    'text' => '#edf2ff',
                    'muted' => '#a7b0c5',
                ],
                'typography' => [
                    'heading' => 'Clash Display',
                    'body' => 'Manrope',
                ],
                'surfaces' => [
                    'radius' => '24px',
                    'shadow' => '0 30px 80px rgba(0, 0, 0, 0.35)',
                ],
                'effects' => [
                    'gradient' => 'radial-gradient(circle at top left, rgba(212, 166, 87, 0.25), transparent 40%), linear-gradient(135deg, #0a0f1c 0%, #11182b 55%, #172447 100%)',
                ],
                'is_active' => true,
            ]
        );

        foreach ([
            ['scope' => 'global', 'group' => 'branding', 'key' => 'site_name', 'label' => 'Site name', 'type' => 'text', 'value' => 'Cabinet Ledger Prestige'],
            ['scope' => 'global', 'group' => 'branding', 'key' => 'tagline', 'label' => 'Tagline', 'type' => 'text', 'value' => 'Expertise comptable, fiscalite et pilotage financier dans une experience digitale premium.'],
            ['scope' => 'global', 'group' => 'contact', 'key' => 'primary_phone', 'label' => 'Primary phone', 'type' => 'text', 'value' => '+33 1 84 80 24 00'],
            ['scope' => 'global', 'group' => 'contact', 'key' => 'primary_email', 'label' => 'Primary email', 'type' => 'text', 'value' => 'contact@ledger-prestige.fr'],
        ] as $setting) {
            Setting::query()->updateOrCreate(
                ['scope' => $setting['scope'], 'group' => $setting['group'], 'key' => $setting['key']],
                [
                    'label' => $setting['label'],
                    'type' => $setting['type'],
                    'value' => $setting['value'],
                    'is_public' => true,
                ]
            );
        }

        $menu = Menu::query()->firstOrCreate(
            ['code' => 'main-navigation'],
            ['name' => 'Main Navigation', 'location' => 'header', 'is_active' => true, 'is_public' => true]
        );

        $home = Page::query()->updateOrCreate(
            ['slug' => 'home'],
            [
                'title' => 'Home',
                'path' => '/',
                'status' => 'published',
                'template' => 'default',
                'hero' => [
                    'eyebrow' => 'Cabinet d expertise comptable',
                    'headline' => 'Pilotage comptable, fiscal et social dans une experience client premium.',
                    'description' => 'Un site public rassurant et un back-office modulaire pour gerer contenus, demandes clients, documents et operations du cabinet.',
                    'ctaLabel' => 'Demander un rendez-vous',
                    'ctaUrl' => '#contact',
                ],
                'published_at' => now(),
            ]
        );

        foreach ([
            [
                'slug' => 'tenue-comptable',
                'name' => 'Tenue comptable et revision',
                'summary' => 'Production comptable rigoureuse, tableaux de bord et supervision continue.',
                'body' => 'Organisation de la tenue, revision des comptes et suivi mensuel des indicateurs clefs.',
                'price_label' => 'Mission recurrente',
            ],
            [
                'slug' => 'fiscalite',
                'name' => 'Fiscalite et declarations',
                'summary' => 'TVA, liasse fiscale, optimisation et calendrier declaratif maitrise.',
                'body' => 'Gestion des obligations fiscales avec un pilotage anticipe et un accompagnement strategique.',
                'price_label' => 'Sur devis',
            ],
            [
                'slug' => 'paie-social',
                'name' => 'Paie et gestion sociale',
                'summary' => 'Bulletins, DSN, contrats et accompagnement RH au quotidien.',
                'body' => 'Externalisation de la paie et support social pour PME, professions liberales et groupes.',
                'price_label' => 'A partir de 25 EUR / bulletin',
            ],
            [
                'slug' => 'creation-entreprise',
                'name' => 'Creation et conseil dirigeant',
                'summary' => 'Structuration, business plan, choix juridiques et pilotage de croissance.',
                'body' => 'Accompagnement des dirigeants de la creation a la structuration financiere de leur entreprise.',
                'price_label' => 'Pack lancement',
            ],
        ] as $service) {
            Service::query()->updateOrCreate(
                ['slug' => $service['slug']],
                array_merge($service, [
                    'status' => 'published',
                    'published_at' => now(),
                    'meta' => ['industry' => 'accounting'],
                ])
            );
        }

        foreach ([
            [
                'name' => 'Claire Martin',
                'company' => 'Maison Rivage',
                'role' => 'Directrice generale',
                'quote' => 'Une vision tres claire de notre rentabilite et un accompagnement d une rare qualite.',
                'rating' => 5,
                'sort_order' => 1,
            ],
            [
                'name' => 'Nicolas Rey',
                'company' => 'Studio Helios',
                'role' => 'Fondateur',
                'quote' => 'Le cabinet combine exigence comptable, conseil et excellente experience client.',
                'rating' => 5,
                'sort_order' => 2,
            ],
            [
                'name' => 'Amina Boulahcen',
                'company' => 'Nova Care',
                'role' => 'DAF',
                'quote' => 'Reporting plus rapide, meilleur pilotage et une vraie relation de confiance.',
                'rating' => 5,
                'sort_order' => 3,
            ],
        ] as $testimonial) {
            Testimonial::query()->updateOrCreate(
                ['name' => $testimonial['name'], 'company' => $testimonial['company']],
                array_merge($testimonial, ['is_active' => true, 'is_featured' => true])
            );
        }

        foreach ([
            [
                'name' => 'Hero',
                'component' => 'hero',
                'sort_order' => 1,
                'content' => $home->hero,
            ],
            [
                'name' => 'Cabinet positioning',
                'component' => 'rich-text',
                'sort_order' => 2,
                'content' => [
                    'title' => 'Un cabinet moderne pour des dirigeants exigeants',
                    'body' => 'Nous combinons excellence technique, conseil proactif et experience digitale premium pour simplifier la relation entre le cabinet et ses clients.',
                ],
            ],
            [
                'name' => 'Accounting features',
                'component' => 'feature-grid',
                'sort_order' => 3,
                'content' => [
                    'title' => 'Ce que le cabinet pilote au quotidien',
                    'items' => [
                        'Comptabilite et revision',
                        'Fiscalite et obligations',
                        'Paie et social',
                        'Tableaux de bord dirigeants',
                    ],
                ],
            ],
            [
                'name' => 'Services',
                'component' => 'service-grid',
                'sort_order' => 4,
                'content' => ['title' => 'Nos expertises'],
            ],
            [
                'name' => 'Stats',
                'component' => 'stats',
                'sort_order' => 5,
                'content' => [
                    'items' => [
                        ['label' => 'Clients accompagnes', 'value' => '250+'],
                        ['label' => 'Delai de reponse', 'value' => '< 24h'],
                        ['label' => 'Expertises', 'value' => '4 poles'],
                    ],
                ],
            ],
            [
                'name' => 'Testimonials',
                'component' => 'testimonials',
                'sort_order' => 6,
                'content' => ['title' => 'Ils nous confient leurs chiffres et leurs decisions'],
            ],
            [
                'name' => 'CTA',
                'component' => 'cta',
                'sort_order' => 7,
                'content' => [
                    'title' => 'Parlons de votre organisation comptable et financiere',
                    'description' => 'Prenez rendez-vous avec un expert pour structurer votre comptabilite, votre fiscalite et vos indicateurs de pilotage.',
                    'buttonLabel' => 'Prendre rendez-vous',
                    'buttonUrl' => '#contact',
                ],
            ],
        ] as $section) {
            PageSection::query()->updateOrCreate(
                ['page_id' => $home->id, 'sort_order' => $section['sort_order']],
                array_merge($section, [
                    'props' => [],
                    'styles' => [],
                    'layout' => [],
                    'visibility_rules' => [],
                ])
            );
        }

        $menu->items()->updateOrCreate(
            ['label' => 'Home'],
            ['type' => 'page', 'page_id' => $home->id, 'sort_order' => 1]
        );

        $menu->items()->updateOrCreate(
            ['label' => 'Services'],
            ['type' => 'internal', 'url' => '#services', 'sort_order' => 2]
        );

        $menu->items()->updateOrCreate(
            ['label' => 'Rendez-vous'],
            ['type' => 'internal', 'url' => '#contact', 'sort_order' => 3]
        );

        foreach ([
            ['name' => 'CMS', 'code' => 'cms', 'category' => 'core'],
            ['name' => 'Forms Builder', 'code' => 'forms', 'category' => 'core'],
            ['name' => 'CRM', 'code' => 'crm', 'category' => 'business'],
            ['name' => 'Invoicing', 'code' => 'invoicing', 'category' => 'business'],
            ['name' => 'Documents', 'code' => 'documents', 'category' => 'business'],
            ['name' => 'Reports', 'code' => 'reports', 'category' => 'analytics'],
        ] as $module) {
            FeatureModule::query()->firstOrCreate(
                ['code' => $module['code']],
                [
                    'name' => $module['name'],
                    'category' => $module['category'],
                    'description' => $module['name'] . ' module',
                    'config' => [],
                    'is_active' => true,
                ]
            );
        }
    }
}
