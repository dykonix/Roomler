-- Roomler sample queries v4. Run schema.sql, then seed.sql, against a CLEAN roomler_dev database.
-- Every owner/property/room/price/inventory row is synthetic demo data.

-- Q1: expected counts are 5 synthetic owners and 20 synthetic properties.
SELECT (SELECT COUNT(*) FROM owners WHERE data_label='synthetic_demo') AS synthetic_owners,
       (SELECT COUNT(*) FROM properties WHERE data_label='synthetic_demo') AS synthetic_properties;

-- Q2: structured budget + city + type + occupancy eligibility. Prices are per room/per bed; choose the correct basis.
SELECT property_id,title,city,locality,property_type,gender_eligibility,
       starting_monthly_room_price,starting_monthly_bed_price,verification_status
FROM property_search_summary
WHERE listing_status='published' AND city='Kota' AND property_type='PG'
  AND gender_eligibility='Boys'
  AND (starting_monthly_room_price <= 12000 OR starting_monthly_bed_price <= 12000)
ORDER BY LEAST(COALESCE(starting_monthly_room_price,999999999),COALESCE(starting_monthly_bed_price,999999999)),title;

-- Q3: Wi-Fi explicitly recorded TRUE. Unknown does not match.
SELECT p.id,p.title,c.canonical_name AS city,l.canonical_name AS locality,pav.value_boolean AS wifi_available,
       pav.verification_status,pav.value_state
FROM properties p JOIN cities c ON c.id=p.city_id LEFT JOIN localities l ON l.id=p.locality_id
JOIN property_attribute_values pav ON pav.property_id=p.id AND pav.attribute_key='wifi_available'
WHERE p.listing_status='published' AND pav.value_state='known' AND pav.value_boolean IS TRUE
ORDER BY city,title;

-- Q4: unknown vs known attributes; unknown must not be presented as No.
SELECT p.title,c.canonical_name AS city,
       MAX(CASE WHEN pav.attribute_key='wifi_available' THEN pav.value_state END) AS wifi_state,
       MAX(CASE WHEN pav.attribute_key='cooking_allowed' THEN CASE WHEN pav.value_state='unknown' THEN 'unknown' WHEN pav.value_boolean THEN 'yes' ELSE 'no' END END) AS cooking_state,
       MAX(CASE WHEN pav.attribute_key='food_included' THEN CASE WHEN pav.value_state='unknown' THEN 'unknown' WHEN pav.value_boolean THEN 'yes' ELSE 'no' END END) AS food_state
FROM properties p JOIN cities c ON c.id=p.city_id LEFT JOIN property_attribute_values pav ON pav.property_id=p.id
WHERE p.listing_status='published' GROUP BY p.id,p.title,c.canonical_name
HAVING BOOL_OR(pav.value_state='unknown') ORDER BY city,p.title;

-- Q5: floor -> room -> price detail. Prices are distinct records; don't confuse a price with availability.
SELECT p.title,c.canonical_name AS city,f.floor_label,r.room_label,r.room_type,r.max_occupants,
       rp.rent_basis,rp.stay_period,rp.amount,r.room_status,r.furnishing_status
FROM properties p JOIN cities c ON c.id=p.city_id JOIN property_floors f ON f.property_id=p.id
JOIN rooms r ON r.floor_id=f.id LEFT JOIN room_prices rp ON rp.room_id=r.id AND rp.is_current
WHERE p.listing_status='published' ORDER BY p.title,f.floor_number,r.room_label,rp.rent_basis;

-- Q6: bed-level status is independent from room-level status.
SELECT p.title,f.floor_label,r.room_label,b.bed_label,b.bed_status
FROM beds b JOIN rooms r ON r.id=b.room_id JOIN property_floors f ON f.id=r.floor_id
JOIN properties p ON p.id=f.property_id WHERE p.listing_status='published'
ORDER BY p.title,f.floor_number,r.room_label,b.bed_label;

-- Q7: explicit room inventory; missing row is unknown, not evidence of absence.
SELECT p.title,r.room_label,ri.item_type,ri.quantity,ri.item_condition,ri.verification_status
FROM room_inventory ri JOIN rooms r ON r.id=ri.room_id JOIN property_floors f ON f.id=r.floor_id
JOIN properties p ON p.id=f.property_id WHERE p.listing_status='published' AND ri.item_type='ac' AND ri.quantity>0
ORDER BY p.title,r.room_label;

-- Q8: landmark lookup example. This is a curated, unverified reference record with no coordinates in the demo.
SELECT c.canonical_name AS city,l.canonical_name AS locality,k.canonical_name AS landmark,k.landmark_type,k.verification_status,k.latitude,k.longitude
FROM landmarks k JOIN cities c ON c.id=k.city_id LEFT JOIN localities l ON l.id=k.locality_id
WHERE c.canonical_name='Delhi' AND k.canonical_name ILIKE '%Laxmi Nagar%';

-- Q9: city/locality resolution example; Noida Sector 82 is distinct from Delhi Laxmi Nagar.
SELECT c.canonical_name AS city,l.canonical_name AS locality,l.locality_type,l.center_latitude,l.center_longitude,l.data_label
FROM localities l JOIN cities c ON c.id=l.city_id
WHERE (c.canonical_name='Noida' AND l.canonical_name='Sector 82')
   OR (c.canonical_name='Delhi' AND l.canonical_name='Laxmi Nagar');

-- Q10: safe application pattern. Bind values; do not interpolate LLM output into SQL identifiers or SQL text.
-- $1 city, $2 property_type, $3 gender_eligibility, $4 max_monthly_rent.
PREPARE roomler_search(text, text, text, numeric) AS
SELECT property_id,
       title,
       city,
       locality,
       starting_monthly_room_price,
       starting_monthly_bed_price
FROM property_search_summary
WHERE listing_status = 'published'
  AND city = $1
  AND property_type = $2
  AND gender_eligibility = $3
  AND (
      starting_monthly_room_price <= $4
      OR starting_monthly_bed_price <= $4
  )
ORDER BY title;

EXECUTE roomler_search('Kota', 'PG', 'Boys', 12000);
DEALLOCATE roomler_search;
