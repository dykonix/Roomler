# Roomler — Database Design

## Source files and safety

- Schema: `database/schema.sql` (clean-install schema for a new, empty Roomler database).
- Synthetic data: `database/seed.sql`.
- Query examples: `database/sample-queries.sql`.

Do not run the clean-install schema against an existing or unrelated database. Seed owners, properties, prices, room inventory and contact placeholders are synthetic and must not be represented as genuine listings.

## Entity groups

| Group | Purpose |
|---|---|
| Cities, city aliases | Canonical city names and alternate names |
| Localities, locality aliases, landmarks | Location hierarchy and reference points |
| Owners | Property owner/operator records |
| Properties | Property type, location, description, eligibility, status and provenance |
| Property floors, rooms, beds | Property-to-inventory hierarchy |
| Room prices | Amount, currency, rent basis, stay period and validity |
| Property attribute values | Structured amenity values, state and verification metadata |
| Property images | Image metadata, ordering, cover state and verification |
| Room inventory | Room-level inventory items and condition |
| Property search summary | Search-oriented view including monthly room/bed starting prices |

The SQL schema is authoritative for exact columns, constraints, indexes and foreign keys.

## Key modeling decisions

### Property, room and bed are separate
A property can have multiple floors, rooms and beds. Room status and bed status are independent. A price record does not itself prove availability.

### Preserve price basis
Room-level and bed-level prices may differ. Store the rent basis and stay period. A listing-level starting price may be displayed as “Starts at ₹X/month,” but the detail view should preserve the recorded basis.

### Unknown is not false
An absent attribute record is not evidence that the attribute is absent. Keep a value state such as known/unknown with verification metadata. Positive filters should match only explicitly known positive values.

### Listing status differs from data label
Publication status indicates whether a listing is published. Data label distinguishes real-submitted data from synthetic demo data. Production public search must enforce both conditions.

### Provenance matters
Where supported, retain source name, source URL/record ID, verification status and timestamps. Do not label a listing verified merely because a row exists.

## Query examples

`database/sample-queries.sql` demonstrates:
- city/type/eligibility/budget filtering;
- explicit Wi-Fi true versus unknown values;
- property → floor → room → price joins;
- independent bed-level status;
- room inventory;
- city/locality resolution;
- parameterized prepared statements.

Never interpolate LLM output into SQL. Use bound values and allow-listed field mappings.

## Clean local setup

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/sample-queries.sql
```

Run only against a new, empty Roomler database. Record actual query output when executed. Complete schema/seed/query execution has not been verified as part of the current feature-branch work.
