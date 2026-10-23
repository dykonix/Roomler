# Roomler MVP PRD

**Status:** Draft; planning-stage product.  
**Evidence standard:** The problem framing below contains hypotheses from the product brief, not validated market research. No launch results or user outcomes are claimed.

## Problem and vision

Roomler explores accommodation discovery for students and young professionals in Indian Tier 2/3 cities. The product hypothesis is that tenants need to compare more than price and location: occupancy eligibility, cooking permission, Wi-Fi, deposit terms, notice period, price basis and whether details are confirmed.

**Vision:** Help tenants find a stay that fits their budget and daily needs while making unknown information visible instead of inventing answers.

## Users

- **Student:** needs a budget-compatible PG/flat and wants clear eligibility, amenity and room-sharing details.
- **Early-career professional:** compares location, recurring price, deposit and notice period.
- **Property owner/operator:** eventually needs a straightforward way to submit and maintain accurate listings.

These are design hypotheses, not research-validated personas.

## MVP outcomes

1. Search published PGs/flats using explicit structured filters.
2. Compare monthly starting prices and open property details.
3. Display unknown, missing and unverified attributes honestly.
4. Keep synthetic demo data isolated and labelled.
5. Establish a foundation for future AI preference extraction without claiming AI functionality that is not implemented.

## Scope and prioritization

| Priority | Scope | Acceptance |
|---|---|---|
| P0 | City/locality, PG/flat and monthly budget | Supported inputs validated; results come from PostgreSQL |
| P0 | Wi-Fi/cooking filters | Only explicitly known positive values satisfy a positive filter |
| P0 | Property detail | Displays stored terms and room prices; missing values remain unknown |
| P0 | Empty/error/loading states | Distinct, understandable states with a recovery path |
| P0 | Demo-data safety | Synthetic rows labelled and excluded from production results |
| P1 | Owner listing submission/moderation | Requires an authorized owner workflow |
| P1 | Natural-language search | Only after schema validation and evaluation are implemented |
| P2 | Flatmate discovery, owner ERP, recommendations, mobile app | Out of the first structured-search slice |

## Core journey

Homepage → choose PG/flat and location → add structured filters → inspect results → open details → contact owner only when an authorized contact flow exists. If no results match, explain the state and let the user relax filters.

## User stories

### Search
As a tenant, I want to filter by location, type, budget and known amenities.

Acceptance: invalid type or negative/non-numeric budget returns a client error; SQL parameters are bound; unknown Wi-Fi does not match Wi-Fi=true; production results are limited to published real-submitted listings.

### Property details
As a tenant, I want to inspect room-level prices and rental terms.

Acceptance: details reflect API/database values; price basis is preserved where available; unknown terms are not inferred; missing images show a placeholder; owner contact is not fabricated.

### Natural-language search (future)
As a tenant, I want to describe my needs in ordinary language.

Acceptance before release: extract a typed preference object, validate against an allow-list, clarify unsupported or ambiguous constraints, filter against database facts, and explain applied constraints. The LLM must not generate SQL or invent property facts.

**Current status:** Natural-language preference matching is not implemented. The UI discloses this limitation.

## Success metrics (proposed, not measured)

- Search submission rate = searches submitted / homepage sessions.
- Search-to-detail rate = sessions opening a property / sessions with results.
- No-results rate = searches returning zero results / total searches.
- Filter correctness = returned listings satisfying explicit hard constraints / returned listings.
- Listing completeness = listings with all required high-priority fields / published listings.
- Synthetic-data leakage into production; target is zero.

No baseline or target is asserted until instrumentation and real usage data exist.

## Assumptions and risks

Assumptions: PostgreSQL remains the source of truth; monthly rental search is the initial public slice; real supply, verification, freshness and contact workflows must be built before launch.

| Risk | Mitigation |
|---|---|
| Synthetic listings mistaken for genuine | Label demo data and enforce production visibility rules |
| Unknown interpreted as No or Yes | Preserve value state and render “Not confirmed” |
| Price basis misunderstood | Preserve room/bed basis in storage and detail display |
| Stale listing terms | Add owner update and freshness workflow |
| Unauthorized contact or owner actions | Add authentication, authorization and consent checks |
| Future LLM invents fields/facts | Schema validation, allow-list mapping, parameterized SQL, DB-grounded results |

## Release status

The public journey is committed on a draft feature branch. Local build, backend typecheck, live API/SQL tests and browser tests are not yet verified for this branch. Do not describe the product as launched, market-validated or production-ready.
