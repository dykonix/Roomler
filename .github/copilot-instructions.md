# Roomler — AI Coding Instructions

## Product
Roomler is a planning-stage accommodation discovery product for students and young professionals in Indian Tier 2/3 cities, initially including Noida, Prayagraj, Patna and Kota.

The product differentiator is lifestyle-fit discovery, not simply low rent. Relevant preferences may include occupancy eligibility, cooking permission, Wi-Fi, budget, location, and stay duration.

## Existing project
- Frontend: React, TypeScript and Vite in /frontend.
- PostgreSQL 17 database: roomler_dev, hosted locally through Homebrew.
- /roomler_dev/roomler_dev.sqlproj is a SQL Server database project. Do not treat it as a PostgreSQL schema.
- Inspect files and database structure before proposing changes.
- Do not assume Next.js, an API server, ORM, authentication, or AI search has been implemented.

## Engineering rules
1. Make small, reviewable changes and explain their purpose.
2. Inspect relevant files before editing them.
3. Preserve working code and existing user decisions.
4. Never reset, drop, recreate, or migrate the database without explicit approval.
5. Never stage or commit files without approval.
6. Never expose, log, or commit secrets, credentials, tokens, or private environment files.
7. Keep database credentials on the server. The browser must never connect directly to PostgreSQL.
8. Use parameterized SQL or safe ORM query APIs. Validate all input on the server.
9. Use TypeScript types and clear error handling.
10. Run available lint, build and tests after relevant changes. Report actual results and failures.
11. Do not claim code or queries were tested unless they were actually executed.
12. Do not invent property listings, user research, metrics, verification status, or implementation outcomes.

## Property-data integrity
- Distinguish confirmed values, unknown values and unverified values.
- Unknown does not mean false.
- AI must not invent schema fields or property attributes.
- Map natural-language preferences only to explicitly supported fields.
- Validate extracted filters against an allowlist before querying.
- Unsupported or ambiguous preferences must trigger clarification or an explicit limitation.
- Use description search only as a documented fallback; do not present it as verified structured data.
- All demo properties must be labeled synthetic.

## Product scope
Prioritize a coherent MVP:
1. Location and search preferences.
2. Property results and structured filtering.
3. Property details and owner contact.
4. Empty-results and unknown-attribute states.
5. Twenty synthetic PostgreSQL property records.
6. AI-assisted preference extraction only after structured search works.

Do not add unnecessary infrastructure or expand scope without explaining the trade-off.

## Working method
Before implementation:
1. Summarize the existing state.
2. Identify the smallest useful change.
3. State the files to be modified.
4. Ask before destructive or broad changes.

After implementation, report:
- Files changed.
- Commands and tests actually run.
- Verified outcomes.
- Known limitations and next steps.
