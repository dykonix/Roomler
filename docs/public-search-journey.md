# Public Search Journey — Implementation Notes

## Scope

This branch adds a first-pass public Roomler journey alongside the existing development admin interface:

- Homepage with PG / flat entry points, city or locality, and structured filters.
- Search results with monthly price display, known/unknown amenity states, empty state, and price sorting.
- Property detail with occupancy eligibility, amenities, rental terms, room-level prices, and a contact placeholder.
- The admin UI remains routed under `/admin`.

This is a planning-stage MVP implementation, not a launched or production-ready marketplace.

## Data integrity and listing visibility

The public API queries PostgreSQL. In production, search and detail endpoints are intended to expose only listings with `listing_status = 'published'` and `data_label = 'real_submitted'`. Synthetic demo rows can be included only outside production when `includeDemo=true`; the UI labels demo mode as synthetic. This behavior is implemented in `backend/src/server.ts`, but has not yet been verified against a running deployment in this branch.

Unknown attributes should remain visibly unknown. The UI renders unconfirmed Wi-Fi, cooking, occupancy and rental terms as “Not confirmed” or “Not provided”; unknown Wi-Fi does not satisfy the Wi-Fi filter.

## Supported search parameters

`GET /api/public/properties` accepts:

- `city`: exact city name.
- `locality`: locality substring.
- `type`: `PG` or `Flat`.
- `maxRent`: non-negative monthly price ceiling.
- `wifi=true`: known Wi-Fi availability must be true.
- `cooking=true`: cooking must be explicitly allowed on the property or by a known structured attribute.
- `includeDemo=true`: development-only inclusion of synthetic records.

`GET /api/public/properties/:id` returns the public property detail, current room prices, and images, subject to the same real-versus-synthetic visibility policy.

## Natural-language search status

The search text box is a UI affordance only at this stage. No LLM, prompt, preference extraction, schema validation, semantic search, or natural-language ranking is implemented. When text is entered, the UI explains that it was not used to filter results. The MVP currently relies on explicit structured filters. This is deliberate: the interface must not imply AI matching that does not exist.

Flatmate discovery is also not implemented; its tab is marked as coming soon.

## Images and branding

The public UI references `/roomler-logo.png`. The lowercase and uppercase logo paths currently contain identical image bytes on the feature branch; the UI uses the lowercase path. The existing `/favicon.svg` remains in place. Property image records with `s3://` storage paths are not treated as browser-loadable URLs and display a placeholder instead.

## Known limitations / release blockers

- GitHub Actions run #20 passed frontend build/lint and backend typecheck on an earlier branch revision. Later commits still need a fresh CI run. Live API/SQL tests have not been run.
- The backend uses `http://localhost:3001/api/public` in the frontend; deployment requires a configured API base URL and CORS origin.
- Owner contact details are not returned by the public API, so the details page explains that contact is not yet connected.
- Login, owner listing submission, and flatmate discovery are not implemented in the public journey.
- Natural-language search and recommendations are not implemented.
- The existing demo property data is synthetic and should never be presented as genuine or verified accommodation.
- Production authentication, authorization, owner verification and listing moderation remain separate work.

## Manual verification checklist

Run from a local checkout after installing dependencies and configuring the backend environment:

1. Start PostgreSQL and the backend; verify `GET /api/health`.
2. Run `npm run typecheck` in `backend`.
3. Run `npm run build` and `npm run lint` in `frontend`.
4. Test `GET /api/public/properties?includeDemo=true` in development; confirm synthetic rows carry their demo label.
5. Test city, locality, PG/Flat, monthly budget, Wi-Fi and cooking filters independently.
6. Confirm unknown Wi-Fi does not pass `wifi=true`; confirm unknown values display as unconfirmed.
7. Open a returned property ID and verify monthly starting price, room-level prices, images and rental terms against PostgreSQL.
8. Open a synthetic detail route directly with `?includeDemo=true`, refresh it, and confirm the demo mode is preserved.
9. Confirm a production-configured API never returns synthetic rows, even when the query includes `includeDemo=true`.
10. Record actual outputs and defects before removing the draft status from the pull request.

Until these checks are run, the implementation should be described as committed but unverified.
