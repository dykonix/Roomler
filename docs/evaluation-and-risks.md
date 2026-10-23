# Roomler — Evaluation and Risks

## Evidence status

The current database seed is synthetic. No real-user study, production traffic, conversion result or LLM evaluation score is claimed. GitHub Actions run #20 passed frontend build, frontend lint and backend typecheck on an earlier branch revision. Later commits have not yet been confirmed by a fresh run. Live API/SQL and browser tests have not been run.

## Expected-versus-actual test plan

| Test | Expected behavior | Actual status |
|---|---|---|
| Budget + city + PG/Flat | Only matching published records within the monthly ceiling | SQL/API test not run for this branch |
| Wi-Fi=true | Only explicitly known true values pass | Intended in query; live result not verified |
| Unknown Wi-Fi/cooking | Unknown stays unknown; does not satisfy a positive filter | UI/query logic present; live test not verified |
| Invalid type | API rejects unsupported type with HTTP 400 | Validation code present; request not executed |
| Negative/non-numeric budget | API rejects invalid budget with HTTP 400 | Validation code present; request not executed |
| Synthetic demo rows | Visible only in development with explicit flag and clearly labelled | Code policy present; production test not run |
| Direct property URL / refresh | Detail fetch succeeds or shows a clear loading/error state | Code present; browser test not run |
| Missing/unusable image | Placeholder appears; no fabricated photo | Fallback present; browser test not run |
| Natural-language request | UI discloses that free-text matching is not implemented | Disclosure present; browser test not run |
| SQL injection-style input | Treated as a bound value; never executable SQL | Parameterized SQL used; injection test not run |

## Minimum release checks

1. Run frontend install, build and lint commands.
2. Run backend install and typecheck commands.
3. Start PostgreSQL and the API; check the /api/health endpoint.
4. Execute schema, seed and sample queries only against a clean Roomler database.
5. Test all public filters and invalid inputs; record HTTP status and returned IDs.
6. Confirm unknown values do not satisfy affirmative filters.
7. Confirm production never returns synthetic rows, even when includeDemo=true.
8. Compare property detail output against stored prices, rooms, images and terms.
9. Test mobile layouts, keyboard access, loading/error/no-results states and direct-route refresh.
10. Update this document with observed results before claiming the tests pass.

## Future AI evaluation

No LLM preference parser is implemented. Before enabling one, build a labeled evaluation set covering clear requests, ambiguous budgets/locations, unsupported preferences, contradictory constraints, unknown amenities, invented fields, malformed JSON, prompt injection and no-results cases.

Proposed metrics:
- **Schema-valid extraction rate:** valid typed objects / total requests.
- **Preference precision:** extracted supported constraints that match user intent / extracted constraints.
- **Constraint satisfaction:** returned listings meeting hard constraints / returned listings.
- **Unknown-state correctness:** unknown fields rendered as unknown / unknown fields shown.
- **Unsupported-preference disclosure:** unsupported requests clearly disclosed / unsupported requests.
- **Synthetic-data leakage:** synthetic rows returned in production (target: zero).

Set numeric targets only after running a labeled set and establishing a baseline.

## Risk register

| Risk | Mitigation |
|---|---|
| Synthetic inventory mistaken for genuine | Label demo rows; enforce production visibility policy; regression-test it |
| Stale price or availability | Add owner update process and freshness tracking |
| Occupancy restrictions inferred from title | Use explicit structured eligibility only |
| Unknown amenity treated as no/yes | Preserve value state and test filters |
| Price basis misrepresented | Retain room/bed basis in storage and detail |
| Unauthorized owner/admin actions | Authentication and role-based authorization before production |
| Contact privacy or fabricated details | No contact until an authorized, consented flow exists |
| Future LLM hallucination | Schema validation, allow-list mapping, parameterized SQL, DB-grounded results |
| Poor locality resolution | Canonical aliases, clarification and evaluation cases |
| Hardcoded localhost API URL | Environment-specific API configuration before deployment |

## Current conclusion

Implementation and documentation are committed to a draft feature branch. CI run #20 passed frontend build/lint and backend typecheck on an earlier revision; the latest commits still need a fresh run. Live database/API and browser execution have not been verified. Keep the PR in draft until the latest checks and actual results are recorded.
