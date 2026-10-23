-- Roomler: allow food-included and food-excluded monthly offers to coexist.
-- Additive to offer data; replaces the old uniqueness rule that allowed only
-- one current price per room/rent basis/stay period, regardless of food option.
-- Review and back up the target database before applying. Do not run blindly.
BEGIN;

DROP INDEX IF EXISTS public.uq_room_prices_one_current_basis_period;

CREATE INDEX IF NOT EXISTS idx_room_prices_current_offer_lookup
  ON public.room_prices (room_id, stay_period, is_current, offer_status, food_option, amount);

COMMIT;
