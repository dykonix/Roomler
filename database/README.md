# Roomler database package (v4 draft)

This package is designed for a clean, separate `roomler_dev` PostgreSQL database. Do not run it against ComputerStore ERP.

## Files
- `schema.sql` — normalized PostgreSQL schema.
- `seed.sql` — six cities, curated reference locality names, one unverified landmark example, five synthetic owners, 20 synthetic properties and associated demo inventory/prices/attributes.
- `sample-queries.sql` — ten queries for counts, budget filtering, unknown attributes, floor/room/bed detail, and location lookup.

## Important data labels
- Owners, properties, room inventory, prices and contact placeholders are synthetic. They are not real listings and must not be presented as genuine or verified.
- City/locality/landmark names are reference/demo records. No coordinates are fabricated. The Laxmi Nagar Metro Station record is explicitly unverified and has no coordinates.
- Missing values mean unknown, not No. Prices do not prove availability.

## Apply locally
Create/use a separate database named `roomler_dev`, then run in order:

```bash
psql -d roomler_dev -v ON_ERROR_STOP=1 -f schema.sql
psql -d roomler_dev -v ON_ERROR_STOP=1 -f seed.sql
psql -d roomler_dev -v ON_ERROR_STOP=1 -f sample-queries.sql
```

Run from this directory, or supply full paths. The scripts are intended for a fresh empty demo database; `schema.sql` is not a migration and is not safe to re-run over an existing schema.

## Review status
- Schema and seed were statically revised together.
- Not executed against PostgreSQL in this environment because `psql`/PostgreSQL binaries are not available here. Run the commands locally and report any error before claiming the database passes.
- Before any public deployment: implement and test authentication/authorization and Row Level Security policies; this package does not itself grant public/admin access. Never put database passwords or service-role keys in frontend code.

## Design notes
- `cities` and `localities` are normalized; properties reference them by foreign key. City and locality consistency is enforced by a trigger.
- `landmarks` and aliases support searches such as “PG near Laxmi Nagar Metro Station”; distance ranking is intentionally not enabled without reliable coordinates or route data.
- Room/floor/bed inventory and prices are separate; a lowest price is not a bookable-availability guarantee.
- AI preference extraction must map only to allowlisted fields. Unsupported preferences must trigger a documented description-search fallback or a limitation message, never invented database columns.
