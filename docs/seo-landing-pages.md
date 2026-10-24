# Roomler SEO landing pages

## Status

The reusable SEO landing-page route and presentation work is implemented in the frontend source. It has **not yet been built or tested in a local browser**. This is a client-rendered React/Vite application; setting a title and description after JavaScript runs does not provide the same crawl reliability as server-rendered HTML. Treat this as the staging implementation, not as proof of production SEO readiness.

## Supported route patterns

- `/pg-in-noida/`
- `/girls-pg-in-noida/`
- `/boys-pg-in-noida/`
- `/pg-in-prayagraj/`, `/pg-in-patna/`, `/pg-in-kota/` and their gender-category variants
- `/pg-in-noida/sector-63/` (locality template)
- `/property/<readable-property-slug>--<property-uuid>` (individual listing; stable UUID identifies the record)

City routes resolve against the canonical city names returned by `/api/public/locations`. The category and locality pages reuse one template and request the existing public listings API. Only listings allowed by the backend's public listing rules are returned; the page must not use synthetic demo rows as real accommodation.

## Environment variables

- `VITE_API_BASE_URL`: backend origin, for example the staging API origin without `/api/public`. The frontend appends `/api/public`. If unset, local development falls back to `http://localhost:3001`.
- `VITE_INDEXING_ENABLED`: set to `false` or leave unset on staging. The SEO landing and property-detail pages add `noindex,nofollow`. Set to `true` only for production after content and technical SEO checks.

Do not put database credentials or private API keys in any `VITE_*` variable; Vite exposes these values to browser code.

## Staging verification checklist

1. Set `VITE_API_BASE_URL` to the staging backend origin.
2. Leave `VITE_INDEXING_ENABLED` unset or set it to `false`.
3. Confirm the staging host serves the SPA entry point for nested URLs on a fresh browser load; otherwise configure the host's history fallback.
4. Test all four city routes, both gender categories, a locality route, a property URL, unknown/empty results, and browser back/forward.
5. Confirm synthetic demo properties are not shown as genuine public inventory.
6. Confirm the page's title, description, canonical URL and `noindex,nofollow` in browser developer tools.
7. Before production, verify real listing inventory, unique page content, valid canonical URLs, sitemap generation, redirects/404 handling, and crawler-visible HTML. Consider prerendering or server-side rendering before enabling indexing.

## Production indexation policy

Creating a route does not automatically mean it should be indexed. Keep pages with no published matching listings out of the production sitemap and preferably noindex them. Do not index near-duplicate combinations simply because a route can be generated. Add pages to the sitemap only when they have useful, accurate content and matching public inventory.

## Known limitations / follow-up

- Metadata is set client-side; prerendering/server rendering is not implemented.
- A sitemap has not been implemented because it must be generated from the production domain and currently indexable city/locality/property records.
- Property URLs include a readable slug and UUID. The UUID is the identity; title changes should not break the route.
- Hosting-specific SPA fallback must be confirmed against the chosen staging host.
- Locality pages currently use the locality slug as a text filter against the existing listings API. Validate real locality naming and aliases against the database before production.
