# Roomler — Solution Architecture

## Status

The current implementation is React + TypeScript + Vite, an Express API, and PostgreSQL. Structured search exists in code; natural-language preference extraction is not implemented. This document separates current components from proposed future AI work.

## Current flow

```text
Browser (React + TypeScript + Vite)
       | GET /api/public/properties
       | GET /api/public/properties/:id
       v
Express API (validation + parameterized SQL)
       v
PostgreSQL (properties, rooms, prices, attributes, images)
```

- **Frontend:** captures explicit location, property type, budget and amenity filters; renders results and unknown states.
- **API:** validates supported property type and budget, applies visibility rules, executes parameterized queries, and returns property facts.
- **Database:** source of truth for listing, price, room, amenity and provenance fields.
- **Not present:** LLM, RAG, embeddings, AI ranking, login/contact workflow, or public owner submission.

## Current request sequence

1. User submits structured filters.
2. Frontend serializes supported query parameters.
3. API validates values.
4. SQL filters property data and explicitly known positive amenity values.
5. API returns database-backed results and detail data.
6. UI displays unknown/missing values as unknown rather than inferring them.

Production results are intended to include only published real-submitted listings. Synthetic demo rows are allowed only outside production with an explicit flag.

## Proposed AI-assisted search (future)

```text
Natural-language request
       v
LLM extracts candidate preferences as schema-constrained JSON
       v
Backend validates fields, types and enums against an allow-list
       +---- unsupported/ambiguous constraint? --> clarify or disclose
       v
Parameterized database filtering
       v
Optional deterministic ranking
       v
Explainable results + applied filters + unknown attributes
```

Example candidate object for “PG in Kota under ₹12,000, Wi-Fi, cooking allowed, boys”:

```json
{
  "city": "Kota",
  "property_type": "PG",
  "max_monthly_rent": 12000,
  "wifi_available": true,
  "cooking_allowed": true,
  "gender_eligibility": "Boys"
}
```

This is an illustrative target contract, not an implemented LLM output.

## Responsibility boundaries

- **LLM:** parse the user's request into candidate preferences and optionally explain filters. It does not author SQL or supply property facts.
- **Backend:** validate the candidate object, map only supported fields, enforce visibility/authorization, execute parameterized SQL, and record evaluation data.
- **Database:** return stored property facts and their provenance/value states.
- **Ranking:** start with deterministic, explainable ranking; do not add a separate model before it is justified.

If a preference such as “quiet” has no supported structured field, the system must not pretend it filtered on that preference. It should ask a clarification, disclose the limitation, or use a documented and evaluated fallback if one is implemented.

## Future AI safeguards

- Reject unknown JSON keys and unsupported enum values.
- Never interpolate model output into SQL identifiers or query text.
- Preserve unknown attributes; do not convert unknown into false.
- Never fill missing property facts with LLM-generated guesses.
- Evaluate ambiguous/contradictory requests, malformed JSON, prompt injection, unsupported preferences and no-results cases.
- Explain which constraints were applied and which were unsupported.

## Deployment and verification gaps

- Frontend currently hardcodes the API base to localhost; make it environment-configurable before deployment.
- Configure CORS and secrets per environment.
- Add authentication and role-based authorization before owner/admin actions are production-enabled.
- Verify frontend build, backend typecheck, public API filters and synthetic-data exclusion. These checks are not yet confirmed for the current branch.
