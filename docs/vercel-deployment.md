# Vercel Deployment Notes

Last updated: 2026-06-06

## Current status

- Frontend Vite project: deployed on Vercel
- Production domain: `https://xtrendaipro.com`
- Linked Vercel project: `kimiaitrader`
- Backend Laravel API: not deployable yet from the current repository snapshot

## Frontend deployment

The frontend is deployed from `frontend/`.

Key commands:

```powershell
cd frontend
$env:NODE_OPTIONS='--use-system-ca'
npx.cmd vercel deploy --prod --yes --scope adilbtp-8978s-projects
```

The `vite.config.ts` file is configured with `base: "/"`, which is the correct setting for a root-served Vercel deployment.

## Frontend environment variables

Create these in the Vercel project that serves the frontend:

```env
VITE_API_URL=https://api.xtrendaipro.com/api
```

Local reference file:

- `frontend/.env.example`

## Backend deployment blocker

The current `backend/` directory is only a partial Laravel application and is missing core framework files required to boot and deploy a real Laravel API.

Missing essentials observed in the repository:

- `artisan`
- `public/index.php`
- standard Laravel config files such as `config/app.php`, `config/database.php`, `config/auth.php`, `config/session.php`, `config/cache.php`, `config/filesystems.php`

Because of that, creating a Vercel deployment for the backend now would produce a broken runtime, even if Composer dependencies install successfully.

## Backend environment variables to prepare now

When the Laravel scaffold is completed, create these in the Vercel backend project:

```env
APP_NAME=XTrendAI Pro API
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://api.xtrendaipro.com
FRONTEND_URL=https://xtrendaipro.com
SANCTUM_STATEFUL_DOMAINS=xtrendaipro.com,www.xtrendaipro.com
SESSION_DOMAIN=.xtrendaipro.com
LOG_CHANNEL=stack
LOG_LEVEL=error
DB_CONNECTION=mysql
DB_HOST=
DB_PORT=3306
DB_DATABASE=
DB_USERNAME=
DB_PASSWORD=
CACHE_STORE=database
QUEUE_CONNECTION=database
SESSION_DRIVER=database
```

Local reference file:

- `backend/.env.example`

## Recommended next step for the backend

Restore or scaffold a complete Laravel 11 application in `backend/`, then create a separate Vercel project for the API. After that:

1. Add the missing Laravel skeleton files
2. Install Composer dependencies
3. Add a Vercel PHP runtime entrypoint
4. Configure database-backed production environment variables
5. Deploy the backend as a separate Vercel project, ideally on `api.xtrendaipro.com`

## Bundle optimization status

Frontend bundle optimization has already started:

- route-level lazy loading added in `frontend/src/App.tsx`
- manual chunk splitting added in `frontend/vite.config.ts`

This reduces the amount of JavaScript loaded on the first render and makes future deployments healthier.
