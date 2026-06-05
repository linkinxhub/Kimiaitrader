# Architecture

Cette plateforme vise un cabinet d expertise comptable premium. Le site public doit inspirer confiance, clarte et precision, tout en restant visuellement coherent avec l admin panel.

## Vision

La plateforme est construite comme un système modulaire piloté par configuration :

- le backend expose une API REST unifiée
- l'admin panel consomme cette API et génère une grande partie de l'interface à partir d'un registre de modules
- le site public consomme les mêmes données CMS, menus, thèmes et formulaires
- les builders stockent leur état en base de données et pilotent directement le rendu public

## Couches

### Backend Laravel

- `config/platform.php` : registre central des modules, builders, composants et permissions
- `app/Support/ModuleRegistry.php` : résolution des modules dynamiques
- `app/Services/Cms/*` : logique de synchronisation du CMS et des formulaires
- `app/Services/Modules/DynamicModuleService.php` : CRUD générique, filtres, recherche, custom fields
- `app/Http/Controllers/Api/*` : endpoints admin et publics
- `app/Models/*` : modèles Eloquent pour chaque builder et module métier
- `database/migrations/*` : schéma complet
- `database/seeders/*` : permissions, rôle admin, données de démarrage

### Frontend React

- `src/router` : routes publiques et admin
- `src/layouts` : layouts premium public/admin
- `src/features/admin` : builders et écrans CRUD
- `src/features/public` : rendu public dynamique
- `src/components/builders` : drag and drop avec `dnd-kit`
- `src/api` : client Axios et accès API
- `src/lib` : registres frontend de modules et composants

## Principes structurants

### Registre de modules

Un registre central décrit le libellé, le modèle backend, les champs, les validations, les permissions et les vues de chaque module.

### Builders stockés en base

- pages et sections dans `pages`, `page_sections`, `page_revisions`
- formulaires dans `forms`, `form_fields`, `form_submissions`
- menus dans `menus`, `menu_items`
- thèmes et settings dans `themes`, `settings`
- dashboards dans `dashboards`, `dashboard_widgets`

### Extensibilité

Les entités métier peuvent être enrichies via `custom_fields` et `custom_field_values` sans casser le schéma principal.
