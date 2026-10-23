-- Roomler PostgreSQL schema v4 (PostgreSQL 14+ / Supabase)
-- Planning/portfolio schema. Creates structure only; seed data is maintained separately.
-- Apply only to a NEW empty roomler_dev database. This is a clean-install schema, not a migration.
-- Review and run seed.sql only after this schema succeeds. Never run against ComputerStore ERP.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- Canonical geographic hierarchy and aliases; preserve source/provenance for imported data.
CREATE TABLE cities (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, canonical_name TEXT NOT NULL,
 state_name TEXT NOT NULL, country_code CHAR(2) NOT NULL DEFAULT 'IN', slug TEXT NOT NULL UNIQUE,
 is_active BOOLEAN NOT NULL DEFAULT true, source_name TEXT NOT NULL DEFAULT 'curated', source_record_id TEXT,
 source_url TEXT, data_label TEXT NOT NULL DEFAULT 'reference_data' CHECK(data_label IN ('reference_data','synthetic_demo')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(country_code,canonical_name,state_name)
);
CREATE TABLE city_aliases (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
 alias TEXT NOT NULL CHECK (NULLIF(BTRIM(alias),'') IS NOT NULL), normalized_alias TEXT NOT NULL CHECK (NULLIF(BTRIM(normalized_alias),'') IS NOT NULL), source_name TEXT NOT NULL DEFAULT 'curated',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(city_id,normalized_alias)
);
CREATE INDEX idx_city_aliases_normalized ON city_aliases(normalized_alias);
CREATE TABLE localities (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
 name TEXT NOT NULL, canonical_name TEXT NOT NULL,
 locality_type TEXT NOT NULL DEFAULT 'neighbourhood' CHECK(locality_type IN ('neighbourhood','sector','colony','district','suburb','village','other')),
 slug TEXT NOT NULL, center_latitude NUMERIC(9,6), center_longitude NUMERIC(9,6),
 source_name TEXT NOT NULL DEFAULT 'curated', source_record_id TEXT, source_url TEXT, source_updated_at TIMESTAMPTZ,
 data_label TEXT NOT NULL DEFAULT 'reference_data' CHECK(data_label IN ('reference_data','synthetic_demo')),
 is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(city_id,slug),
 CHECK((center_latitude IS NULL AND center_longitude IS NULL) OR (center_latitude IS NOT NULL AND center_longitude IS NOT NULL)),
 CHECK(center_latitude IS NULL OR center_latitude BETWEEN -90 AND 90),
 CHECK(center_longitude IS NULL OR center_longitude BETWEEN -180 AND 180)
);
CREATE INDEX idx_localities_city_name ON localities(city_id,canonical_name);
CREATE TABLE locality_aliases (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), locality_id UUID NOT NULL REFERENCES localities(id) ON DELETE CASCADE,
 alias TEXT NOT NULL CHECK (NULLIF(BTRIM(alias),'') IS NOT NULL), normalized_alias TEXT NOT NULL CHECK (NULLIF(BTRIM(normalized_alias),'') IS NOT NULL), language_code TEXT, source_name TEXT NOT NULL DEFAULT 'curated',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(locality_id,normalized_alias)
);
CREATE INDEX idx_locality_aliases_normalized ON locality_aliases(normalized_alias);
CREATE TABLE landmarks (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
 locality_id UUID REFERENCES localities(id) ON DELETE SET NULL, name TEXT NOT NULL, canonical_name TEXT NOT NULL,
 landmark_type TEXT NOT NULL CHECK(landmark_type IN ('metro_station','railway_station','bus_station','college','university','hospital','office_hub','shopping_area','road','transit_stop','other')),
 latitude NUMERIC(9,6), longitude NUMERIC(9,6), provider TEXT CHECK(provider IN ('openstreetmap','google_places','geonames','manual','other')),
 provider_place_id TEXT, source_url TEXT, source_record_id TEXT, source_updated_at TIMESTAMPTZ,
 data_label TEXT NOT NULL DEFAULT 'reference_data' CHECK(data_label IN ('reference_data','synthetic_demo')),
 verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK(verification_status IN ('unverified','source_imported','independently_checked')),
 is_active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
 CHECK(latitude IS NULL OR latitude BETWEEN -90 AND 90), CHECK(longitude IS NULL OR longitude BETWEEN -180 AND 180),
 CHECK(verification_status <> 'independently_checked' OR (latitude IS NOT NULL AND longitude IS NOT NULL))
);
CREATE INDEX idx_landmarks_city_name ON landmarks(city_id,canonical_name);
CREATE INDEX idx_landmarks_city_type ON landmarks(city_id,landmark_type);
CREATE OR REPLACE FUNCTION roomler_validate_landmark_geography() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE locality_city_id UUID;
BEGIN
 IF NEW.locality_id IS NOT NULL THEN
  SELECT city_id INTO locality_city_id FROM localities WHERE id=NEW.locality_id;
  IF locality_city_id IS NULL OR locality_city_id <> NEW.city_id THEN
   RAISE EXCEPTION 'Landmark locality must belong to the selected city' USING ERRCODE='check_violation';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_landmark_geography BEFORE INSERT OR UPDATE OF city_id,locality_id ON landmarks FOR EACH ROW EXECUTE FUNCTION roomler_validate_landmark_geography();
CREATE UNIQUE INDEX uq_landmarks_provider_place ON landmarks(provider,provider_place_id) WHERE provider IS NOT NULL AND provider_place_id IS NOT NULL;
CREATE TABLE landmark_aliases (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), landmark_id UUID NOT NULL REFERENCES landmarks(id) ON DELETE CASCADE,
 alias TEXT NOT NULL CHECK (NULLIF(BTRIM(alias),'') IS NOT NULL), normalized_alias TEXT NOT NULL CHECK (NULLIF(BTRIM(normalized_alias),'') IS NOT NULL), language_code TEXT, source_name TEXT NOT NULL DEFAULT 'curated',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(landmark_id,normalized_alias)
);
CREATE INDEX idx_landmark_aliases_normalized ON landmark_aliases(normalized_alias);

CREATE TABLE owners (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), display_name TEXT NOT NULL,
 contact_phone TEXT, contact_email TEXT,
 owner_status TEXT NOT NULL DEFAULT 'active' CHECK (owner_status IN ('active','inactive','pending')),
 data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (NULLIF(BTRIM(contact_phone),'') IS NOT NULL OR NULLIF(BTRIM(contact_email),'') IS NOT NULL)
);

CREATE TABLE properties (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE RESTRICT,
 title TEXT NOT NULL, property_type TEXT NOT NULL CHECK (property_type IN ('PG','Flat')),
 city_id UUID NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
 locality_id UUID REFERENCES localities(id) ON DELETE RESTRICT,
 address TEXT, latitude NUMERIC(9,6), longitude NUMERIC(9,6),
 coordinate_source TEXT CHECK(coordinate_source IN ('openstreetmap','google_places','manual','owner_submitted','other')),
 coordinate_checked_at TIMESTAMPTZ, google_maps_url TEXT, google_place_id TEXT, description TEXT NOT NULL DEFAULT '', 
 gender_eligibility TEXT CHECK (gender_eligibility IN ('Boys','Girls','Unisex')),
 couples_allowed BOOLEAN, co_ed_rooms_allowed BOOLEAN, cooking_allowed BOOLEAN, visitors_allowed BOOLEAN,
 parents_visits_allowed BOOLEAN, curfew_applies BOOLEAN, curfew_time TIME, house_rules_notes TEXT,
 daily_stay_available BOOLEAN, weekly_stay_available BOOLEAN, monthly_stay_available BOOLEAN,
 minimum_locking_period_value NUMERIC(8,2) CHECK (minimum_locking_period_value IS NULL OR minimum_locking_period_value > 0),
 minimum_locking_period_unit TEXT CHECK (minimum_locking_period_unit IN ('days','weeks','months')),
 security_deposit_basis TEXT CHECK (security_deposit_basis IN ('one_month_rent','two_months_rent','three_months_rent','fixed_amount','not_required')),
 security_deposit_amount NUMERIC(12,2) CHECK (security_deposit_amount IS NULL OR security_deposit_amount >= 0),
 notice_period_value NUMERIC(8,2) CHECK (notice_period_value IS NULL OR notice_period_value >= 0),
 notice_period_unit TEXT CHECK (notice_period_unit IN ('days','weeks','months')), rental_terms_notes TEXT,
 listing_status TEXT NOT NULL DEFAULT 'draft' CHECK (listing_status IN ('draft','published','paused','removed')),
 listing_source TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (listing_source IN ('synthetic_demo','owner_submitted','admin_entered','external_source')),
 verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','owner_confirmed','independently_checked')),
 last_confirmed_at TIMESTAMPTZ, data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
 CHECK ((latitude IS NULL AND coordinate_source IS NULL) OR (latitude IS NOT NULL AND coordinate_source IS NOT NULL)),
 CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90), CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
 CHECK ((minimum_locking_period_value IS NULL AND minimum_locking_period_unit IS NULL) OR (minimum_locking_period_value IS NOT NULL AND minimum_locking_period_unit IS NOT NULL)),
 CHECK ((notice_period_value IS NULL AND notice_period_unit IS NULL) OR (notice_period_value IS NOT NULL AND notice_period_unit IS NOT NULL)),
 CHECK (security_deposit_amount IS NULL OR security_deposit_basis IS NOT NULL),
 CHECK (security_deposit_basis <> 'not_required' OR security_deposit_amount IS NULL),
 CHECK (security_deposit_basis <> 'fixed_amount' OR security_deposit_amount IS NOT NULL),
 CHECK (verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL)
);
CREATE INDEX idx_properties_location_type_status ON properties(city_id,locality_id,property_type,listing_status);
CREATE INDEX idx_properties_coordinates ON properties(latitude,longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_properties_owner ON properties(owner_id);

-- Explicit relationship is optional. Distances must be sourced or computed, never guessed.
CREATE TABLE property_landmarks (
 property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 landmark_id UUID NOT NULL REFERENCES landmarks(id) ON DELETE CASCADE,
 relationship_type TEXT NOT NULL DEFAULT 'nearby' CHECK(relationship_type IN ('nearby','inside','same_complex','address_reference')),
 distance_meters INTEGER CHECK(distance_meters IS NULL OR distance_meters >= 0),
 distance_method TEXT CHECK(distance_method IN ('straight_line','walking_route','driving_route','source_claim','unknown')),
 distance_source TEXT, distance_checked_at TIMESTAMPTZ, notes TEXT,
 PRIMARY KEY(property_id,landmark_id),
 CHECK((distance_meters IS NULL AND distance_method IS NULL) OR (distance_meters IS NOT NULL AND distance_method IS NOT NULL)),
 CHECK(distance_method <> 'source_claim' OR NULLIF(BTRIM(distance_source),'') IS NOT NULL)
);
CREATE INDEX idx_property_landmarks_landmark ON property_landmarks(landmark_id,property_id);

CREATE OR REPLACE FUNCTION roomler_validate_property_landmark_city() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE property_city UUID; landmark_city UUID;
BEGIN
 SELECT city_id INTO property_city FROM properties WHERE id=NEW.property_id;
 SELECT city_id INTO landmark_city FROM landmarks WHERE id=NEW.landmark_id;
 IF property_city IS NULL OR landmark_city IS NULL OR property_city <> landmark_city THEN
  RAISE EXCEPTION 'Property and landmark must belong to the same city' USING ERRCODE='check_violation';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_property_landmark_city BEFORE INSERT OR UPDATE ON property_landmarks
FOR EACH ROW EXECUTE FUNCTION roomler_validate_property_landmark_city();


CREATE TABLE property_floors (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 floor_number SMALLINT NOT NULL, floor_label TEXT NOT NULL, floor_specific_entrance BOOLEAN,
 entrance_access_notes TEXT, lift_serves_this_floor BOOLEAN, notes TEXT,
 data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 UNIQUE(property_id,floor_number), UNIQUE(property_id,floor_label)
);
CREATE INDEX idx_floors_property ON property_floors(property_id,floor_number);

CREATE TABLE shared_areas (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 floor_id UUID REFERENCES property_floors(id) ON DELETE CASCADE,
 area_type TEXT NOT NULL CHECK (area_type IN ('shared_bathroom','shared_balcony','sitting_area','dining_area','entertainment_tv_area','common_kitchen','laundry_area','terrace','coworking_space','gym','play_area','parking_area','other')),
 name TEXT NOT NULL, quantity INTEGER CHECK (quantity IS NULL OR quantity >= 0), details TEXT,
 availability_status TEXT NOT NULL DEFAULT 'unknown' CHECK (availability_status IN ('yes','no','unknown')),
 verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','owner_confirmed','independently_checked')),
 source_note TEXT, last_confirmed_at TIMESTAMPTZ,
 data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 CHECK (verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL)
);
CREATE INDEX idx_shared_areas_type ON shared_areas(property_id,area_type);

CREATE OR REPLACE FUNCTION roomler_validate_shared_area_floor() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE floor_property UUID;
BEGIN
 IF NEW.floor_id IS NOT NULL THEN
  SELECT property_id INTO floor_property FROM property_floors WHERE id=NEW.floor_id;
  IF floor_property IS NULL OR floor_property <> NEW.property_id THEN
   RAISE EXCEPTION 'Shared area floor must belong to the same property' USING ERRCODE='check_violation';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_shared_area_floor BEFORE INSERT OR UPDATE OF property_id,floor_id ON shared_areas
FOR EACH ROW EXECUTE FUNCTION roomler_validate_shared_area_floor();

-- Attribute catalogue supports scope-specific checklists without one table per amenity.
CREATE TABLE attribute_catalog (
 attribute_key TEXT PRIMARY KEY, display_name TEXT NOT NULL,
 scope TEXT NOT NULL CHECK (scope IN ('property','floor','room','shared_area','billing')),
 value_type TEXT NOT NULL CHECK (value_type IN ('boolean','number','text','enum')),
 unit TEXT, allowed_values TEXT[], searchable BOOLEAN NOT NULL DEFAULT true, description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE property_attribute_values (
 property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 attribute_key TEXT NOT NULL REFERENCES attribute_catalog(attribute_key),
 value_state TEXT NOT NULL DEFAULT 'known' CHECK (value_state IN ('known','unknown')),
 value_boolean BOOLEAN, value_number NUMERIC(12,2), value_text TEXT,
 verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','owner_confirmed','independently_checked')),
 source_note TEXT, last_confirmed_at TIMESTAMPTZ, PRIMARY KEY(property_id,attribute_key),
 CHECK ((value_state='unknown' AND value_boolean IS NULL AND value_number IS NULL AND value_text IS NULL) OR
        (value_state='known' AND ((value_boolean IS NOT NULL)::int + (value_number IS NOT NULL)::int + (value_text IS NOT NULL)::int = 1))),
 CHECK (verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL)
);
CREATE TABLE floor_attribute_values (
 floor_id UUID NOT NULL REFERENCES property_floors(id) ON DELETE CASCADE,
 attribute_key TEXT NOT NULL REFERENCES attribute_catalog(attribute_key),
 value_state TEXT NOT NULL DEFAULT 'known' CHECK (value_state IN ('known','unknown')),
 value_boolean BOOLEAN, value_number NUMERIC(12,2), value_text TEXT,
 verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','owner_confirmed','independently_checked')),
 source_note TEXT, last_confirmed_at TIMESTAMPTZ, PRIMARY KEY(floor_id,attribute_key),
 CHECK ((value_state='unknown' AND value_boolean IS NULL AND value_number IS NULL AND value_text IS NULL) OR
        (value_state='known' AND ((value_boolean IS NOT NULL)::int + (value_number IS NOT NULL)::int + (value_text IS NOT NULL)::int = 1))),
 CHECK (verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL)
);
CREATE TABLE room_attribute_values (
 room_id UUID NOT NULL, attribute_key TEXT NOT NULL REFERENCES attribute_catalog(attribute_key),
 value_state TEXT NOT NULL DEFAULT 'known' CHECK (value_state IN ('known','unknown')),
 value_boolean BOOLEAN, value_number NUMERIC(12,2), value_text TEXT,
 verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','owner_confirmed','independently_checked')),
 source_note TEXT, last_confirmed_at TIMESTAMPTZ, PRIMARY KEY(room_id,attribute_key),
 CHECK ((value_state='unknown' AND value_boolean IS NULL AND value_number IS NULL AND value_text IS NULL) OR
        (value_state='known' AND ((value_boolean IS NOT NULL)::int + (value_number IS NOT NULL)::int + (value_text IS NOT NULL)::int = 1))),
 CHECK (verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL)
);

CREATE TABLE rooms (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), floor_id UUID NOT NULL REFERENCES property_floors(id) ON DELETE CASCADE,
 room_label TEXT NOT NULL, room_type TEXT NOT NULL CHECK (room_type IN ('single','shared')),
 max_occupants SMALLINT NOT NULL CHECK (max_occupants > 0),
 furnishing_status TEXT CHECK (furnishing_status IN ('furnished','semi_furnished','unfurnished')),
 room_status TEXT NOT NULL DEFAULT 'unknown' CHECK (room_status IN ('available','occupied','reserved','unavailable','unknown')),
 attached_bathroom BOOLEAN, private_balcony BOOLEAN, private_geyser BOOLEAN, hot_water_in_attached_bathroom BOOLEAN,
 wifi_available_in_room BOOLEAN, wifi_speed_mbps NUMERIC(8,2) CHECK (wifi_speed_mbps IS NULL OR wifi_speed_mbps >= 0),
 notes TEXT, data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(floor_id,room_label)
);
ALTER TABLE room_attribute_values ADD CONSTRAINT room_attribute_room_fk FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE;
CREATE INDEX idx_rooms_floor_status ON rooms(floor_id,room_status);
CREATE INDEX idx_rooms_type_occupancy ON rooms(room_type,max_occupants);

CREATE TABLE room_prices (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 rent_basis TEXT NOT NULL CHECK (rent_basis IN ('per_room','per_bed')),
 stay_period TEXT NOT NULL CHECK (stay_period IN ('daily','weekly','monthly')),
 amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0), currency CHAR(3) NOT NULL DEFAULT 'INR',
 valid_from DATE, valid_to DATE, is_current BOOLEAN NOT NULL DEFAULT true, notes TEXT,
 data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from)
);
CREATE INDEX idx_room_prices_search ON room_prices(stay_period,rent_basis,amount) WHERE is_current=true;
CREATE INDEX idx_room_prices_room_current ON room_prices(room_id,is_current);
CREATE UNIQUE INDEX uq_room_prices_one_current_basis_period ON room_prices(room_id,rent_basis,stay_period) WHERE is_current = true;

CREATE TABLE beds (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 bed_label TEXT NOT NULL, bed_type TEXT NOT NULL CHECK (bed_type IN ('single','double','other')),
 bed_status TEXT NOT NULL DEFAULT 'unknown' CHECK (bed_status IN ('available','occupied','reserved','unavailable','unknown')),
 mattress_present BOOLEAN, mattress_thickness_inches NUMERIC(5,2) CHECK (mattress_thickness_inches IS NULL OR mattress_thickness_inches > 0),
 notes TEXT, data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 UNIQUE(room_id,bed_label)
);
CREATE INDEX idx_beds_room_status ON beds(room_id,bed_status);

CREATE TABLE room_inventory (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
 bed_id UUID REFERENCES beds(id) ON DELETE CASCADE,
 item_type TEXT NOT NULL CHECK (item_type IN ('ac','fan','study_table','chair','wardrobe','desk_lamp','refrigerator','tv','electric_kettle','microwave','single_bed','mattress','other')),
 quantity INTEGER DEFAULT 1 CHECK (quantity IS NULL OR quantity >= 0),
 item_condition TEXT CHECK (item_condition IN ('new','good','fair','poor','unknown')),
 verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','owner_confirmed','independently_checked')),
 source_note TEXT, last_confirmed_at TIMESTAMPTZ,
 data_label TEXT NOT NULL DEFAULT 'synthetic_demo' CHECK (data_label IN ('synthetic_demo','real_submitted')),
 CHECK (verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL)
);
CREATE INDEX idx_room_inventory_item ON room_inventory(item_type,room_id);

-- Property-level amenity checklist (including billing-related electricity term).
INSERT INTO attribute_catalog(attribute_key,display_name,scope,value_type,unit,allowed_values,searchable,description) VALUES
('wifi_available','Wi-Fi available','property','boolean',NULL,NULL,true,'Property-level availability does not guarantee room coverage.'),
('cooking_allowed','Cooking allowed','property','boolean',NULL,NULL,true,'Unknown stays unknown; do not infer from property type.'),
('food_included','Food included','property','boolean',NULL,NULL,true,'Whether meals are included; details may be recorded separately.'),
('couples_allowed','Couples allowed','property','boolean',NULL,NULL,true,'Eligibility is property-reported unless independently checked.'),
('visitors_allowed','Visitors allowed','property','boolean',NULL,NULL,true,'House rules may contain restrictions or time windows.'),
('daily_stay_available','Daily stay available','property','boolean',NULL,NULL,true,''),
('weekly_stay_available','Weekly stay available','property','boolean',NULL,NULL,true,''),
('monthly_stay_available','Monthly stay available','property','boolean',NULL,NULL,true,''),
('advertised_wifi_speed_mbps','Advertised Wi-Fi speed','property','number','Mbps',NULL,true,'Advertised, not independently measured unless evidence supports that.'),
('power_backup','Power backup','property','boolean',NULL,NULL,true,''),('ro_drinking_water','RO drinking water','property','boolean',NULL,NULL,true,''),
('hot_water_supply','Hot water supply','property','boolean',NULL,NULL,true,''),('lift_available','Lift/elevator','property','boolean',NULL,NULL,true,''),
('security_guard','Security guard','property','boolean',NULL,NULL,true,''),('cctv_cameras','CCTV cameras','property','boolean',NULL,NULL,true,''),
('separate_entrance','Separate entrance','property','boolean',NULL,NULL,true,''),('fire_safety_equipment','Fire safety equipment','property','boolean',NULL,NULL,true,''),
('meals_provided','Meals provided','property','boolean',NULL,NULL,true,''),('housekeeping','Housekeeping','property','boolean',NULL,NULL,true,''),
('laundry_service','Laundry service','property','boolean',NULL,NULL,true,''),('washing_machine','Washing machine','property','boolean',NULL,NULL,true,''),
('electricity_included_in_rent','Electricity included in rent','billing','boolean',NULL,NULL,true,'Billing rule, not a physical amenity.'),
('car_parking','Car parking','property','boolean',NULL,NULL,true,''),('two_wheeler_parking','Two-wheeler parking','property','boolean',NULL,NULL,true,''),
('gym','Gym','property','boolean',NULL,NULL,true,''),('play_area','Play area','property','boolean',NULL,NULL,true,''),
('shared_tv_entertainment','Shared TV/entertainment facilities','property','boolean',NULL,NULL,true,''),('common_kitchen','Common kitchen','property','boolean',NULL,NULL,true,''),
('common_dining_area','Common dining area','property','boolean',NULL,NULL,true,''),('terrace_access','Terrace access','property','boolean',NULL,NULL,true,''),
('coworking_space','Co-working space','property','boolean',NULL,NULL,true,''),('shared_refrigerator','Shared refrigerator','property','boolean',NULL,NULL,true,''),
('microwave','Microwave','property','boolean',NULL,NULL,true,''),('electric_kettle','Electric kettle','property','boolean',NULL,NULL,true,''),
('parking_capacity','Parking capacity','property','number','vehicles',NULL,true,''),('meals_details','Meals details','property','text',NULL,NULL,false,'Optional meal types, schedule and charges.'),
-- Floor-level checklist
('wifi_available_on_floor','Wi-Fi available on this floor','floor','boolean',NULL,NULL,true,''),('wifi_speed_on_floor_mbps','Wi-Fi speed on this floor','floor','number','Mbps',NULL,true,''),
('shared_bathroom_available','Shared bathroom available','floor','boolean',NULL,NULL,true,'Prefer individual shared_areas records for count and facilities.'),
('number_of_shared_bathrooms','Number of shared bathrooms','floor','number','bathrooms',NULL,true,''),('hot_water_on_floor','Hot water on this floor','floor','boolean',NULL,NULL,true,''),
('shared_geyser','Shared geyser','floor','boolean',NULL,NULL,true,'Equipment can be linked to a shared bathroom/area.'),
('balcony_shared_by_floor','Balcony shared by this floor','floor','boolean',NULL,NULL,true,''),('common_sitting_area','Common sitting area','floor','boolean',NULL,NULL,true,''),
('dining_area_on_floor','Dining area on this floor','floor','boolean',NULL,NULL,true,''),('entertainment_tv_area','Entertainment/TV area','floor','boolean',NULL,NULL,true,''),
('common_kitchen_on_floor','Common kitchen on this floor','floor','boolean',NULL,NULL,true,''),('laundry_machine_on_floor','Laundry/washing machine on this floor','floor','boolean',NULL,NULL,true,''),
-- Room-level checklist
('ac','Air conditioning (AC)','room','boolean',NULL,NULL,true,'Quantity/condition can be recorded in room_inventory.'),('fan','Fan','room','boolean',NULL,NULL,true,''),
('wifi_available_in_room','Wi-Fi available in room','room','boolean',NULL,NULL,true,''),('room_wifi_speed_mbps','Room-level Wi-Fi speed','room','number','Mbps',NULL,true,''),
('single_bed_present','Single bed present','room','boolean',NULL,NULL,true,'Detailed bed records belong in beds.'),('double_bed_present','Double bed present','room','boolean',NULL,NULL,true,''),
('mattress_present','Mattress present','room','boolean',NULL,NULL,true,'Prefer bed-level details if mattresses vary.'),('mattress_thickness_inches','Mattress thickness','room','number','inches',NULL,true,''),
('study_table','Study table','room','boolean',NULL,NULL,true,''),('chair','Chair','room','boolean',NULL,NULL,true,''),('wardrobe','Wardrobe','room','boolean',NULL,NULL,true,''),('desk_lamp','Desk lamp','room','boolean',NULL,NULL,true,''),
('attached_bathroom','Attached bathroom','room','boolean',NULL,NULL,true,'Private, not shared.'),('private_balcony','Private balcony','room','boolean',NULL,NULL,true,'Private, not shared balcony/terrace.'),
('private_geyser','Private geyser','room','boolean',NULL,NULL,true,''),('hot_water_in_attached_bathroom','Hot water in attached bathroom','room','boolean',NULL,NULL,true,''),
('refrigerator_in_room','Refrigerator in room','room','boolean',NULL,NULL,true,''),('tv_in_room','TV in room','room','boolean',NULL,NULL,true,''),
('electric_kettle_in_room','Electric kettle in room','room','boolean',NULL,NULL,true,''),('microwave_in_room','Microwave in room','room','boolean',NULL,NULL,true,''),
('furnishing_status','Furnishing status','room','enum',NULL,ARRAY['furnished','semi_furnished','unfurnished'],true,''),
('room_type','Room type','room','enum',NULL,ARRAY['single','shared'],true,''),('max_occupancy','Maximum occupancy','room','number','people',NULL,true,'')
ON CONFLICT(attribute_key) DO NOTHING;


-- Enforce attribute catalogue scope at the database boundary, not just in application code.
CREATE OR REPLACE FUNCTION roomler_validate_attribute_scope() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE expected_scope TEXT;
BEGIN
 SELECT scope INTO expected_scope FROM attribute_catalog WHERE attribute_key=NEW.attribute_key;
 IF expected_scope IS NULL OR NOT (expected_scope = TG_ARGV[0] OR (TG_ARGV[0] = 'property' AND expected_scope = 'billing')) THEN
  RAISE EXCEPTION 'Attribute % is not valid for scope %',NEW.attribute_key,TG_ARGV[0] USING ERRCODE='check_violation';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_property_attribute_scope BEFORE INSERT OR UPDATE ON property_attribute_values FOR EACH ROW EXECUTE FUNCTION roomler_validate_attribute_scope('property');
CREATE TRIGGER trg_floor_attribute_scope BEFORE INSERT OR UPDATE ON floor_attribute_values FOR EACH ROW EXECUTE FUNCTION roomler_validate_attribute_scope('floor');
CREATE TRIGGER trg_room_attribute_scope BEFORE INSERT OR UPDATE ON room_attribute_values FOR EACH ROW EXECUTE FUNCTION roomler_validate_attribute_scope('room');

CREATE OR REPLACE FUNCTION roomler_validate_attribute_value_type() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE expected_type TEXT; allowed TEXT[]; supplied_count INTEGER; supplied_value TEXT;
BEGIN
 SELECT value_type,allowed_values INTO expected_type,allowed FROM attribute_catalog WHERE attribute_key=NEW.attribute_key;
 supplied_count := (NEW.value_boolean IS NOT NULL)::int + (NEW.value_number IS NOT NULL)::int + (NEW.value_text IS NOT NULL)::int;
 IF NEW.value_state='unknown' THEN RETURN NEW; END IF;
 IF supplied_count <> 1 THEN RAISE EXCEPTION 'Exactly one typed value is required for attribute %',NEW.attribute_key USING ERRCODE='check_violation'; END IF;
 IF expected_type='boolean' AND NEW.value_boolean IS NULL OR expected_type='number' AND NEW.value_number IS NULL OR expected_type IN ('text','enum') AND NEW.value_text IS NULL THEN
  RAISE EXCEPTION 'Value type does not match catalogue for attribute %',NEW.attribute_key USING ERRCODE='check_violation';
 END IF;
 IF expected_type='enum' AND allowed IS NOT NULL AND NOT (NEW.value_text = ANY(allowed)) THEN
  RAISE EXCEPTION 'Value % is not allowed for attribute %',NEW.value_text,NEW.attribute_key USING ERRCODE='check_violation';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_property_attribute_type BEFORE INSERT OR UPDATE ON property_attribute_values FOR EACH ROW EXECUTE FUNCTION roomler_validate_attribute_value_type();
CREATE TRIGGER trg_floor_attribute_type BEFORE INSERT OR UPDATE ON floor_attribute_values FOR EACH ROW EXECUTE FUNCTION roomler_validate_attribute_value_type();
CREATE TRIGGER trg_room_attribute_type BEFORE INSERT OR UPDATE ON room_attribute_values FOR EACH ROW EXECUTE FUNCTION roomler_validate_attribute_value_type();

CREATE OR REPLACE FUNCTION roomler_validate_property_geography() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE locality_city_id UUID;
BEGIN
 IF NEW.locality_id IS NOT NULL THEN
  SELECT city_id INTO locality_city_id FROM localities WHERE id=NEW.locality_id;
  IF locality_city_id IS NULL OR locality_city_id <> NEW.city_id THEN
   RAISE EXCEPTION 'Property locality must belong to the selected city' USING ERRCODE='check_violation';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_property_geography BEFORE INSERT OR UPDATE OF city_id,locality_id ON properties FOR EACH ROW EXECUTE FUNCTION roomler_validate_property_geography();

CREATE OR REPLACE FUNCTION roomler_validate_inventory_bed_room() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE bed_room_id UUID;
BEGIN
 IF NEW.bed_id IS NOT NULL THEN
  SELECT room_id INTO bed_room_id FROM beds WHERE id=NEW.bed_id;
  IF bed_room_id IS NULL OR bed_room_id <> NEW.room_id THEN
   RAISE EXCEPTION 'Inventory bed_id must belong to the same room_id' USING ERRCODE='check_violation';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER trg_inventory_bed_room BEFORE INSERT OR UPDATE ON room_inventory FOR EACH ROW EXECUTE FUNCTION roomler_validate_inventory_bed_room();

CREATE OR REPLACE FUNCTION roomler_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION roomler_set_updated_at();
CREATE TRIGGER trg_localities_updated_at BEFORE UPDATE ON localities FOR EACH ROW EXECUTE FUNCTION roomler_set_updated_at();
CREATE TRIGGER trg_landmarks_updated_at BEFORE UPDATE ON landmarks FOR EACH ROW EXECUTE FUNCTION roomler_set_updated_at();
CREATE TRIGGER trg_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION roomler_set_updated_at();
CREATE TRIGGER trg_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION roomler_set_updated_at();
CREATE TRIGGER trg_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION roomler_set_updated_at();


COMMENT ON TABLE cities IS 'Canonical city records; Delhi and Noida are distinct city entries.';
COMMENT ON TABLE localities IS 'City-scoped localities such as sectors, colonies and neighbourhoods; coordinates may be unknown.';
COMMENT ON TABLE landmarks IS 'Named points of interest such as metro stations; provider/source and verification are explicit.';
COMMENT ON TABLE property_landmarks IS 'Optional property-to-landmark relationship; distance is never inferred or fabricated.';
COMMENT ON TABLE properties IS 'Property listing; synthetic demo rows must not be represented as genuine inventory.';
COMMENT ON COLUMN properties.locality_id IS 'Must reference a locality in the same city; enforced by trigger.';
COMMENT ON COLUMN properties.coordinate_source IS 'Provenance for coordinates; coordinates are not required for a listing.';
CREATE INDEX idx_properties_status_created ON properties(listing_status,created_at DESC);
CREATE INDEX idx_room_prices_current_amount ON room_prices(amount) WHERE is_current=true;

-- Summary view. A lowest monthly price is not a guarantee of availability.
CREATE VIEW property_search_summary AS
SELECT p.id AS property_id,p.title,c.canonical_name AS city,l.canonical_name AS locality,p.property_type,p.gender_eligibility,
 p.listing_status,p.verification_status,p.data_label,
 MIN(rp.amount) FILTER(WHERE rp.is_current AND rp.stay_period='monthly' AND rp.rent_basis='per_room') AS starting_monthly_room_price,
 MIN(rp.amount) FILTER(WHERE rp.is_current AND rp.stay_period='monthly' AND rp.rent_basis='per_bed') AS starting_monthly_bed_price,
 MIN(rp.amount) FILTER(WHERE rp.is_current AND rp.stay_period='monthly') AS starting_monthly_rent,
 COUNT(DISTINCT f.id) AS floor_count,
 COUNT(DISTINCT r.id) FILTER(WHERE r.room_type='single') AS single_room_count,
 COUNT(DISTINCT r.id) FILTER(WHERE r.room_type='shared') AS shared_room_count,
 COUNT(DISTINCT r.id) FILTER(WHERE r.room_status='available') AS available_room_count,
 COUNT(DISTINCT b.id) FILTER(WHERE b.bed_status='available') AS available_bed_count
FROM properties p JOIN cities c ON c.id=p.city_id LEFT JOIN localities l ON l.id=p.locality_id LEFT JOIN property_floors f ON f.property_id=p.id
LEFT JOIN rooms r ON r.floor_id=f.id LEFT JOIN room_prices rp ON rp.room_id=r.id
LEFT JOIN beds b ON b.room_id=r.id
GROUP BY p.id,p.title,c.canonical_name,l.canonical_name,p.property_type,p.gender_eligibility,p.listing_status,p.verification_status,p.data_label;
COMMIT;

-- Admin authentication is intentionally not stored here: use Supabase Auth, server-side role checks, and RLS.
-- Never store plaintext passwords. Respect geographic data provider licensing, attribution, and retention terms.
-- Important implementation notes:
-- * Missing data is unknown, not No. Do not infer absence from a missing inventory row.
-- * Attribute scope is enforced by database triggers and must also be validated in the backend.
-- * Security-deposit basis does not determine an exact amount unless the applicable rent basis is known.
-- * Add and test Supabase Row Level Security policies before exposing this to real users.
