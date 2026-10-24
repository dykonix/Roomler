# Gemini natural-language search (initial implementation)

## What it does

The public search UI sends the selected city and natural-language request to `POST /api/public/parse-search`. The backend asks Gemini to extract a limited set of supported filters and validates returned values before the frontend calls the existing property search endpoint.

Current supported extraction fields:
- `propertyType`: `PG`, `Flat`, or no preference
- `genderEligibility`: `Boys`, `Girls`, `Unisex`, or no preference
- `maxRent`: maximum monthly amount in INR
- `wifi`: whether Wi-Fi is required or explicitly excluded
- `cookingAllowed`: whether cooking permission is required or explicitly excluded
- `couplesAllowed`: whether a couple-friendly property is required or explicitly excluded

This is an initial vertical slice, not a complete natural-language query planner. It does not yet extract every field from the database or handle every room-level amenity. It does not generate SQL. Expand the field catalogue and query implementation only after confirming database semantics and adding tests.

## Local setup

1. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. In the backend folder, create a local `.env` file.
3. Add `GEMINI_API_KEY=your_key_here` and optionally `GEMINI_MODEL=gemini-2.5-flash`.
4. Do not commit `.env`, put the key in frontend code, or share the key in chat.
5. Restart the backend after changing environment variables.
6. Run the backend typecheck and test the endpoint locally before relying on the feature.

## Endpoint

`POST /api/public/parse-search`

Request:
```json
{
  "city": "Noida",
  "query": "Need a girls PG under ₹12,000 with Wi-Fi and permission to cook"
}
```

Example response shape (illustrative only; not a captured live Gemini response):
```json
{
  "city": "Noida",
  "filters": {
    "propertyType": "PG",
    "genderEligibility": "Girls",
    "maxRent": 12000,
    "wifi": true,
    "cookingAllowed": true,
    "couplesAllowed": null
  }
}
```

## Safety and correctness

- The model receives a field catalogue and is instructed to return JSON only.
- The backend validates enum values, booleans and numeric rent.
- AI does not generate SQL or choose arbitrary database column names.
- A `Girls` request matches `Girls` and `Unisex` listings; a `Boys` request matches `Boys` and `Unisex` listings.
- Wi-Fi must be recorded as known and true to satisfy a Wi-Fi requirement.
- Cooking permission must be true in the structured property field or a known property attribute; unknown is not treated as allowed.
- If Gemini is unavailable, the frontend shows a notice and falls back to the structured filters currently selected. It must not claim the natural-language text was applied.
- Free-tier availability, rate limits and provider data-use terms can change. Check Google's current terms before using real user data.

## Not yet verified

The changes are on a feature branch. No local typecheck, live Gemini API call, database query, or browser test has been run from this change. Verify before merging:
1. Backend typecheck.
2. A real request to `/api/public/parse-search` with the example above.
3. Search results for gender, budget, known Wi-Fi and cooking constraints.
4. Missing API key, provider error, and unsupported preference behavior.
