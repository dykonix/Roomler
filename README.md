# Roomler

**Roomler is a planning-stage accommodation discovery product focused on lifestyle fit, not only rent.** It is intended for students and young professionals looking for PGs and flats in Indian Tier 2/3 cities. The current repository contains a PostgreSQL-backed data model, synthetic demo data, a development admin UI, and a draft public search journey.

> **Status:** Portfolio/MVP work in progress. This repository is not a launched or production-ready marketplace. Demo owners, properties, prices, room inventory and contact placeholders are synthetic; they are not genuine listings and must not be presented as verified accommodation.

## Product problem

People searching for accommodation may need to filter on more than price and location: occupancy eligibility, cooking permission, Wi-Fi, deposit terms, notice period and whether details have actually been confirmed. The product hypothesis is that presenting these attributes transparently can make accommodation discovery more useful.

This is a product hypothesis, not a claim of validated market demand. No user-research results or market validation are claimed here.

## Current scope

- Public homepage and structured search entry points for PGs and flats.
- Results with monthly starting price, explicit unknown states, structured filters, price sorting and a no-results state.
- Property details for eligibility, known amenities, room prices and rental terms.
- PostgreSQL schema and synthetic seed data for development/demo use.
- Development admin routes for property management.
- CI workflow intended to run frontend build/lint and backend typecheck.

Not implemented in the public journey yet: natural-language/LLM search, flatmate discovery, login, public owner submission, live owner contact, booking, recommendation models or a mobile app.

## Architecture

```text
Browser (React + TypeScript + Vite)
        |
        | HTTP /api/public/*
        v
Node.js + Express API
        |
        | parameterized SQL
        v
PostgreSQL
```

- **Frontend:** React, TypeScript and Vite under `frontend/`.
- **Backend:** Node.js, Express and `pg` under `backend/`.
- **Database:** PostgreSQL schema and seed under `database/`.
- **Public search:** structured filters only. The text input is not backed by an LLM and the UI explicitly tells users when natural-language matching is unavailable.
- **Data safety:** production public API queries are intended to show only published `real_submitted` rows. Synthetic demo rows are included only outside production with an explicit query flag and are labelled as synthetic. Verify this behavior with live API tests before deployment.

## Run locally

Prerequisites: Node.js 22+, npm, PostgreSQL 14+.

1. Create a **new, empty** PostgreSQL database for Roomler. Do not run the clean-install schema against an existing or unrelated database.
2. Apply the schema and seed in order:

   ```bash
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql
   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed.sql
   ```

   The seed data is synthetic. Do not use it as live accommodation inventory.

3. Configure the backend environment in `backend/.env` (never commit credentials):

   ```dotenv
   DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/roomler_dev
   FRONTEND_ORIGIN=http://localhost:5173
   PORT=3001
   NODE_ENV=development
   ```

4. Start the API:

   ```bash
   cd backend
   npm ci
   npm run typecheck
   npm run dev
   ```

   Health endpoint: `http://localhost:3001/api/health`.

5. In another terminal, start the frontend:

   ```bash
   cd frontend
   npm ci
   npm run build
   npm run lint
   npm run dev
   ```

   Open the Vite URL printed in the terminal. The current frontend API base is hardcoded to `http://localhost:3001/api/public`; deployment configuration is needed before using another environment.

6. For synthetic demo listings in development, add `?demo=true` to the homepage URL. Demo rows must remain clearly labelled.

## Public API

- `GET /api/public/properties` — supports `city`, `locality`, `type=PG|Flat`, `maxRent`, `wifi=true`, `cooking=true`, and development-only `includeDemo=true`.
- `GET /api/public/properties/:id` — returns property details and room prices subject to the same visibility policy.
- `GET /api/health` — database health check.

The current UI does not expose owner contact information because the public API does not return it.

## Verification status and limitations

The public search journey and its CI workflow are committed on the draft branch `feature/public-search-journey` in [PR #1](https://github.com/dykonix/Roomler/pull/1). The branch has not been merged. A completed CI result, local frontend build, backend typecheck and live SQL/API tests have not yet been verified for that branch. Do not describe these as passing until actual outputs are recorded.

Before treating this as a deployable MVP:
- Run the CI checks and fix failures.
- Execute the documented API filters against PostgreSQL and record expected versus actual results.
- Test that unknown attributes do not pass affirmative filters.
- Test that synthetic data cannot appear in production.
- Configure environment-specific API URLs and CORS.
- Implement and test authentication/authorization, owner contact consent, moderation, image delivery and listing verification.
- Add the missing AI preference extraction and schema-validation pipeline only when ready to evaluate it; do not imply it exists today.

## Project notes

- [MVP PRD](docs/PRD.md)
- [Solution architecture](docs/solution-architecture.md)
- [Database design](docs/database-design.md)
- [Evaluation plan and risks](docs/evaluation-and-risks.md)
- [Public search journey and verification checklist](docs/public-search-journey.md)
- Database clean-install schema: `database/schema.sql`
- Synthetic seed data: `database/seed.sql`
- Sample queries: `database/sample-queries.sql`

Roomler's intended differentiator is lifestyle-fit discovery with explicit data provenance and uncertainty—not AI for its own sake.
