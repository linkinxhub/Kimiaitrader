# Premium Expert-Comptable Platform

Plateforme full-stack premium et administrable pour cabinet d expertise comptable, construite autour d un backend Laravel API-first et d un frontend React/Vite pilote par configuration.

## Monorepo

- `backend` : API Laravel + moteur CMS + builders + modules metier
- `frontend` : site public + admin panel React
- `docs` : architecture, schema de base de donnees et conventions

## Modules livres

- CMS dynamique
- Page builder drag and drop
- Block/section builder
- Dynamic forms builder
- Menus builder
- Theme/settings builder
- Custom fields system
- Roles & permissions system
- Dashboard widgets configuration
- Feature flags/modules activation
- Services, clients, leads, appointments, invoices, tasks, documents, blog, FAQ, testimonials, reports

## Installation

### Backend Laravel

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

### Frontend React

```bash
cd frontend
npm install
npm run dev
```

Sous PowerShell Windows, si `npm` est bloque :

```bash
npm.cmd install
npm.cmd run dev
```

## Variables d environnement

### Backend

```env
APP_NAME="Premium Expert-Comptable Platform"
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=premium_platform
DB_USERNAME=root
DB_PASSWORD=
SANCTUM_STATEFUL_DOMAINS=127.0.0.1:5173,localhost:5173
SESSION_DOMAIN=localhost
```

### Frontend

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## Positionnement produit

- site public premium et rassurant pour cabinet d expertise comptable
- admin panel coherent avec le site et oriente pilotage cabinet
- contenus, formulaires, menus, theme et modules gerables sans coder

## Notes

- L environnement courant ne dispose pas de `php` ni de `composer`, donc le backend a ete code mais pas execute ici.
- Le frontend a deja ete installe et compile avec succes.
- L architecture est pensee pour etre etendue sans reecriture grace au registre de modules et aux builders stockes en base.
