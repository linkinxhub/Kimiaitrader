# XTrendAI Deployment Guide

## Current Architecture

- `frontend/`: React + Vite application deployed on Vercel
- `frontend/api/`: Vercel serverless functions for market and audit endpoints
- `backend/`: incomplete Laravel snapshot, not yet production-ready

## Local Installation

1. Install Node.js 20+.
2. Install frontend dependencies:

```powershell
cd frontend
npm install
```

3. Copy environment variables:

```powershell
Copy-Item .env.example .env
```

4. Start local development:

```powershell
npm run dev
```

## Required Frontend Environment Variables

- `VITE_API_URL`
- `TWELVE_DATA_API_KEY`
- `FINNHUB_API_KEY`
- `ALPHA_VANTAGE_API_KEY`
- `STRIPE_PUBLIC_KEY`
- `PAYPAL_CLIENT_ID`

## Vercel Production Deployment

1. Log in to Vercel.
2. Link the `frontend` directory to the target Vercel project.
3. Configure all production environment variables in Vercel.
4. Deploy:

```powershell
cd frontend
$env:NODE_OPTIONS='--use-system-ca'
npx.cmd vercel deploy --prod --yes --scope adilbtp-8978s-projects
```

## Domain and SSL

- Point the production domain to the Vercel project.
- Confirm automatic SSL issuance is active in the Vercel dashboard.
- Verify the canonical production URL responds in HTTPS only.

## Market Data Configuration

Provider priority currently implemented:

1. Twelve Data
2. Finnhub
3. Alpha Vantage
4. Yahoo Finance fallback

Recommended production rule:

- configure at least one premium provider before launch
- keep Yahoo Finance as a non-premium fallback only
- monitor provider health from `Admin API Center`

## Payments Configuration

The UI now exposes payment readiness, but real checkout is still blocked until the backend is completed.

Before launch, complete:

- Stripe secret/public key configuration
- PayPal production credentials
- Bancontact flow through Stripe or PSP
- webhook signature validation
- subscription activation
- entitlement persistence
- invoice and receipt generation

## Backend Requirements Before Commercial Launch

The current Laravel snapshot is incomplete. Before commercial launch, restore or rebuild:

- framework bootstrap files
- authentication
- subscription storage
- entitlement middleware
- admin secret persistence
- payment webhooks
- audit logs
- queue workers
- cron scheduling
- cache layer

## Database

Recommended production stack:

- PostgreSQL or MySQL for core app data
- Redis for cache, queues, and rate limiting

Minimum production requirements:

- automated backups
- environment-specific credentials
- migration workflow
- restore procedure

## Security Checklist

- HTTPS only
- rate limiting on API routes
- secret keys stored only in environment variables or encrypted server storage
- admin action logging
- brute-force protection
- dependency updates
- error monitoring

## Monitoring Checklist

- Vercel deployment status
- function error logs
- provider health endpoint
- payment health endpoint
- uptime monitoring
- response time tracking

## Launch Blockers Still Open

- incomplete backend control plane
- no real subscription enforcement
- no real payment activation flow
- no secure admin persistence for provider keys
- no mobile application delivery layer

## Recommended Launch Order

1. Complete backend restoration.
2. Wire secure payment webhooks and subscription logic.
3. Persist provider credentials securely from admin.
4. Validate entitlement enforcement end to end.
5. Run staging QA on live market, payment, and admin audit flows.
6. Launch production marketing and paid subscriptions.
