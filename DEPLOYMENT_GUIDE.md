# Deployment Guide

Ce guide suit la structure reelle du projet.
AITraderMarket peut etre deploye soit comme application Node unique, soit avec Docker Compose.

## Prerequis

- Node.js 20+
- npm 10+
- acces a MySQL pour les routes backend dependantes de la base
- credentials Kimi OAuth si l'auth Kimi est activee
- credentials Stripe si les abonnements sont actifs
- cles OpenAI ou Gemini si les analyses backend IA sont utilisees

## Variables d'environnement

Copier `.env.example` vers `.env`.

Variables minimales:

```env
APP_ID=
APP_SECRET=
DATABASE_URL=
KIMI_AUTH_URL=
KIMI_OPEN_URL=
```

Variables frequentes:

```env
OWNER_UNION_ID=
OPENAI_API_KEY=
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
STRIPE_PRICE_EXPERT_MONTHLY=
STRIPE_PRICE_EXPERT_YEARLY=
STRIPE_PRICE_INST_MONTHLY=
STRIPE_PRICE_INST_YEARLY=
VITE_STRIPE_PUBLIC_KEY=
VITE_KIMI_AUTH_URL=
VITE_APP_ID=
PORT=3000
```

## Option A - Node unique

Le fichier `server-dist/boot.js` sert l'application frontend build et les routes API.

### Installation

```bash
npm install
npm run build
```

### Lancement

```bash
NODE_ENV=production PORT=3000 npm run start
```

### Reverse proxy Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Option B - Docker Compose

Le repo contient:

- `Dockerfile` pour le frontend Nginx
- `api/Dockerfile` pour le backend Node
- `docker-compose.yml` pour frontend, backend, MySQL et Redis

### Lancement

```bash
cp .env.example .env
docker compose up --build -d
```

### Notes

- `frontend` sert le build Vite et proxy `/api/` vers `backend:3000`
- `backend` lance `node server-dist/boot.js`
- les variables `VITE_*` doivent exister avant le build frontend
- `DATABASE_URL`, `APP_ID`, `APP_SECRET`, `KIMI_AUTH_URL` et `KIMI_OPEN_URL` sont attendues par le backend en production

## Verification

Verifier le backend:

```bash
curl http://localhost:3000/api/trpc/ping
```

Verifier via le reverse proxy si besoin:

```bash
curl https://your-domain.com/api/trpc/ping
```

Verifier aussi:

- la home charge correctement
- les assets frontend sont servis
- les routes SPA retombent sur `index.html`
- Stripe est configure si le checkout est utilise
- les cles IA sont presentes si les analyses backend sont actives

## Mise a jour

### Mode Node

```bash
git pull
npm install
npm run build
npm run start
```

### Mode Docker

```bash
git pull
docker compose up --build -d
```

## Conseils production

- activer HTTPS avec Nginx et Let's Encrypt
- ne jamais committer `.env`
- privilegier une base MySQL geree si possible
- monitorer les erreurs backend et Stripe
- garder les secrets dans le provider d'hebergement

## Limites connues

- certaines parties du produit restent orientees demo ou configuration locale
- plusieurs integrations externes ont besoin de credentials valides avant une mise en production reelle
