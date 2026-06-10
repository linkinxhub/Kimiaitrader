# AITraderMarket

AITraderMarket est une plateforme de trading assistee par IA construite avec React, Vite, Hono et tRPC.
Le projet combine une interface riche cote client, des modules de signaux de marche, des integrations IA,
un systeme d'abonnements Stripe, et une API Node capable de servir l'application en production.

## Points forts

- Signaux de trading assistes par IA avec export PDF
- Dashboard multi-pages pour suivi, scanner, portefeuille et historique
- Assistant IA avec providers OpenAI, Gemini, Ollama et mode demo
- Alertes, centre news, modules XAU/USD, strategie, smart money et comparateurs
- Backend Hono + tRPC pour auth, packs, abonnements, paiements et endpoints IA
- Build production client + serveur dans un meme pipeline

## Stack technique

- Frontend: React 19, TypeScript, Vite 7, Tailwind CSS, Radix UI, React Query
- Backend: Hono, tRPC, Drizzle ORM
- Paiement: Stripe
- IA: OpenAI, Google Gemini
- Base de donnees: MySQL via `DATABASE_URL`
- Deploiement: Node.js, Docker, Nginx

## Structure utile

- `src/` interface utilisateur
- `api/` serveur Hono, routes tRPC et integrations backend
- `contracts/` constantes et types partages
- `db/` schema, relations et seed
- `public/` assets statiques
- `dist/` build genere apres `npm run build`

## Demarrage local

### Prerequis

- Node.js 20+
- npm 10+
- MySQL accessible si vous utilisez les routes backend qui lisent la base

### Installation

```bash
npm install
cp .env.example .env
```

### Lancer en developpement

```bash
npm run dev
```

Application disponible sur:

- Frontend dev: [http://localhost:3000](http://localhost:3000)

### Build production

```bash
npm run build
```

Le build produit:

- `dist/` pour les assets frontend
- `server-dist/boot.js` pour le serveur Node de production

### Lancer le serveur de production localement

```bash
npm run start
```

Par defaut le serveur ecoute sur `PORT=3000`.

## Variables d'environnement

Copiez `.env.example` vers `.env` et renseignez au minimum:

- `APP_ID`
- `APP_SECRET`
- `DATABASE_URL`
- `KIMI_AUTH_URL`
- `KIMI_OPEN_URL`

Variables frequentes selon les modules utilises:

- `OWNER_UNION_ID`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`
- `STRIPE_PRICE_EXPERT_MONTHLY`
- `STRIPE_PRICE_EXPERT_YEARLY`
- `STRIPE_PRICE_INST_MONTHLY`
- `STRIPE_PRICE_INST_YEARLY`
- `VITE_STRIPE_PUBLIC_KEY`
- `VITE_KIMI_AUTH_URL`
- `VITE_APP_ID`

## Scripts utiles

```bash
npm run dev
npm run build
npm run start
npm run preview
npm run lint
npm run check
npm run test
npm run db:generate
npm run db:migrate
npm run db:push
```

## Deploiement

Deux chemins principaux sont possibles:

### 1. Node.js simple

- `npm install`
- `npm run build`
- definir les variables d'environnement
- `npm run start`

Ce mode sert a la fois le frontend build et l'API via `server-dist/boot.js`.

### 2. Docker Compose

Le depot contient:

- un `Dockerfile` frontend Nginx
- un `api/Dockerfile` backend Node
- un `docker-compose.yml` pour frontend, backend, MySQL et Redis

Workflow:

```bash
cp .env.example .env
docker compose up --build
```

Consultez [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) pour le detail.

## Remarques

- `node_modules/`, `dist/` et `.env` ne sont pas versionnes
- le projet melange frontend et backend dans le meme repo
- certaines integrations necessitent des credentials reels avant mise en production
