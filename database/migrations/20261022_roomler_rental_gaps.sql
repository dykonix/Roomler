-- Roomler focused schema-gap migration
-- Target: existing Roomler PostgreSQL database (NOT a clean install).
-- Run only after taking a database backup and reviewing the preflight checks below.
-- This migration is additive and intentionally preserves existing property/room/price rows.
-- It does NOT seed or alter synthetic demo data.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Safety checks: fail clearly if the expected base schema is not present.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.properties') IS NULL
     OR to_regclass('public.rooms') IS NULL
     OR to_regclass('public.room_prices') IS NULL
     OR to_regclass('public.beds') IS NULL
     OR to_regclass('public.property_floors') IS NULL THEN
    RAISE EXCEPTION
      'Roomler base schema is incomplete. Expected properties, rooms, room_prices, beds and property_floors tables.';
  END IF;

  -- Avoid creating parallel tables if this database already uses another name.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND (table_name ILIKE '%charge%' OR table_name ILIKE '%shared_area%'
           OR table_name ILIKE '%common_area%' OR table_name ILIKE '%billing%')
      AND table_name NOT IN ('room_charges','shared_areas')
  ) THEN
    RAISE EXCEPTION
      'Possible existing charge/shared-area/billing table found under another name. Inspect public table names before applying this migration.';
  END IF;

  -- If canonical room_charges already exists, require the columns this migration uses.
  IF to_regclass('public.room_charges') IS NOT NULL AND NOT (
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='room_charges' AND column_name='room_id') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='room_charges' AND column_name='charge_name') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='room_charges' AND column_name='amount') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='room_charges' AND column_name='charge_basis')
  ) THEN
    RAISE EXCEPTION
      'Existing public.room_charges has a different shape. Inspect it and adapt the migration rather than altering it blindly.';
  END IF;

  -- If canonical shared_areas already exists, require the columns this migration uses.
  IF to_regclass('public.shared_areas') IS NOT NULL AND NOT (
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shared_areas' AND column_name='property_id') AND
    EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='shared_areas' AND column_name='floor_id')
  ) THEN
    RAISE EXCEPTION
      'Existing public.shared_areas has a different shape. Inspect it and adapt the migration rather than altering it blindly.';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 1. Property-level rental terms and parking.
-- Existing security_deposit_basis values are retained. The new policy fields
-- make refund terms explicit rather than inferring them from the deposit amount.
-- ---------------------------------------------------------------------------
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS security_deposit_refund_policy text,
  ADD COLUMN IF NOT EXISTS security_deposit_deduction_notes text,
  ADD COLUMN IF NOT EXISTS electricity_billing_mode text,
  ADD COLUMN IF NOT EXISTS electricity_rate_per_unit numeric(12,2),
  ADD COLUMN IF NOT EXISTS four_wheeler_parking_spaces integer,
  ADD COLUMN IF NOT EXISTS two_wheeler_parking_spaces integer;

-- Extend deposit basis while retaining existing values.
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_security_deposit_basis_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_security_deposit_basis_check
  CHECK (
    security_deposit_basis IS NULL OR security_deposit_basis IN
    ('one_month_rent','two_weeks_rent','two_months_rent','three_months_rent',
     'four_months_rent','fixed_amount','not_required')
  ) NOT VALID;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_security_deposit_refund_policy_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_security_deposit_refund_policy_check
  CHECK (
    security_deposit_refund_policy IS NULL OR
    security_deposit_refund_policy IN ('fully_refundable_no_deductions',
                                       'refundable_with_deductions',
                                       'unknown')
  ) NOT VALID;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_security_deposit_deduction_notes_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_security_deposit_deduction_notes_check
  CHECK (
    security_deposit_refund_policy <> 'refundable_with_deductions'
    OR NULLIF(BTRIM(security_deposit_deduction_notes), '') IS NOT NULL
  ) NOT VALID;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_electricity_billing_mode_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_electricity_billing_mode_check
  CHECK (
    electricity_billing_mode IS NULL OR
    electricity_billing_mode IN ('included_in_rent','metered','unknown')
  ) NOT VALID;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_electricity_rate_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_electricity_rate_check
  CHECK (
    electricity_rate_per_unit IS NULL OR electricity_rate_per_unit >= 0
  ) NOT VALID;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_metered_electricity_rate_required_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_metered_electricity_rate_required_check
  CHECK (
    electricity_billing_mode IS DISTINCT FROM 'metered'
    OR electricity_rate_per_unit IS NOT NULL
  ) NOT VALID;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_four_wheeler_parking_spaces_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_four_wheeler_parking_spaces_check
  CHECK (four_wheeler_parking_spaces IS NULL OR four_wheeler_parking_spaces >= 0) NOT VALID;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_two_wheeler_parking_spaces_check;
ALTER TABLE public.properties
  ADD CONSTRAINT properties_two_wheeler_parking_spaces_check
  CHECK (two_wheeler_parking_spaces IS NULL OR two_wheeler_parking_spaces >= 0) NOT VALID;

-- ---------------------------------------------------------------------------
-- 2. Monthly rental offers.
-- Existing room_prices has stay_period daily/weekly/monthly. Keep old records
-- intact, but disallow non-monthly offers for new or updated rows. NOT VALID
-- intentionally avoids failing on legacy daily/weekly rows.
-- Food is attached to each price offer, so included and excluded offers can coexist.
-- ---------------------------------------------------------------------------
ALTER TABLE public.room_prices
  ADD COLUMN IF NOT EXISTS food_option text,
  ADD COLUMN IF NOT EXISTS offer_status text NOT NULL DEFAULT 'unknown';

ALTER TABLE public.room_prices DROP CONSTRAINT IF EXISTS room_prices_food_option_check;
ALTER TABLE public.room_prices
  ADD CONSTRAINT room_prices_food_option_check
  CHECK (food_option IS NULL OR food_option IN ('included','excluded','unknown')) NOT VALID;

ALTER TABLE public.room_prices DROP CONSTRAINT IF EXISTS room_prices_offer_status_check;
ALTER TABLE public.room_prices
  ADD CONSTRAINT room_prices_offer_status_check
  CHECK (offer_status IN ('active','inactive','unknown')) NOT VALID;

ALTER TABLE public.room_prices DROP CONSTRAINT IF EXISTS room_prices_monthly_only_check;
ALTER TABLE public.room_prices
  ADD CONSTRAINT room_prices_monthly_only_check
  CHECK (stay_period = 'monthly') NOT VALID;

-- ---------------------------------------------------------------------------
-- 3. Availability confirmation timestamps.
-- Room and bed status remain independent. A rent price does not imply availability.
-- ---------------------------------------------------------------------------
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS availability_last_confirmed_at timestamptz;

ALTER TABLE public.beds
  ADD COLUMN IF NOT EXISTS availability_last_confirmed_at timestamptz;

-- ---------------------------------------------------------------------------
-- 4. Room-level recurring and one-time charges.
-- Each charge belongs to a room; nothing is copied automatically to sibling rooms.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  charge_name text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  charge_basis text NOT NULL CHECK (
    charge_basis IN ('one_time','monthly','per_unit','per_use','other')
  ),
  mandatory boolean NOT NULL,
  description text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (
    verification_status IN ('unverified','owner_confirmed','independently_checked')
  ),
  source_note text,
  last_confirmed_at timestamptz,
  data_label text NOT NULL DEFAULT 'real_submitted' CHECK (
    data_label IN ('synthetic_demo','real_submitted')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT room_charges_name_nonblank CHECK (length(btrim(charge_name)) > 0),
  CONSTRAINT room_charges_independent_check_timestamp CHECK (
    verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_room_charges_room_id
  ON public.room_charges(room_id);

-- ---------------------------------------------------------------------------
-- 5. Shared areas.
-- Create a normalized shared-area table only if no table with this exact name
-- already exists. If your project uses a differently named shared-area table,
-- this creates a parallel table only if you run it unchanged; inspect first.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shared_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  floor_id uuid REFERENCES public.property_floors(id) ON DELETE SET NULL,
  area_type text NOT NULL CHECK (
    area_type IN ('bathroom','kitchen','dining_area','sitting_area','laundry_area',
                  'balcony','terrace','other')
  ),
  area_label text,
  access_scope text NOT NULL DEFAULT 'shared' CHECK (
    access_scope IN ('shared','private','restricted','unknown')
  ),
  availability_state text NOT NULL DEFAULT 'unknown' CHECK (
    availability_state IN ('available','unavailable','unknown')
  ),
  notes text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (
    verification_status IN ('unverified','owner_confirmed','independently_checked')
  ),
  source_note text,
  last_confirmed_at timestamptz,
  data_label text NOT NULL DEFAULT 'real_submitted' CHECK (
    data_label IN ('synthetic_demo','real_submitted')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shared_areas_independent_check_timestamp CHECK (
    verification_status <> 'independently_checked' OR last_confirmed_at IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_shared_areas_property_id
  ON public.shared_areas(property_id);
CREATE INDEX IF NOT EXISTS idx_shared_areas_floor_id
  ON public.shared_areas(floor_id);

-- ---------------------------------------------------------------------------
-- 6. Canonical attribute handling.
-- Do not add duplicate room attributes here. Existing room columns and
-- room_attribute_values overlap; application code should choose one canonical
-- source per field and avoid writing conflicting values to both.
-- ---------------------------------------------------------------------------

COMMIT;

-- ---------------------------------------------------------------------------
-- POST-MIGRATION CHECKS (run separately after COMMIT)
-- ---------------------------------------------------------------------------
-- 1) Confirm the added fields/tables:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema='public'
--   AND (table_name IN ('properties','room_prices','rooms','beds','room_charges','shared_areas'))
-- ORDER BY table_name, ordinal_position;
--
-- 2) Review legacy non-monthly prices. These rows are preserved but must not be
--    shown as valid MVP offers; resolve them deliberately before validating the
--    monthly-only constraint:
-- SELECT id, room_id, rent_basis, stay_period, amount, is_current
-- FROM public.room_prices WHERE stay_period <> 'monthly';
--
-- 3) Review tables with potentially overlapping responsibilities BEFORE using
--    shared_areas if your database already had a differently named equivalent:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema='public' AND table_type='BASE TABLE'
-- ORDER BY table_name;
