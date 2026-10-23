-- Roomler v4 seed/schema alignment patch for an already-created roomler_dev database.
-- Run this once before the corrected seed.sql. It does not delete data.
BEGIN;

ALTER TABLE room_inventory
  DROP CONSTRAINT IF EXISTS room_inventory_item_type_check;

ALTER TABLE room_inventory
  ADD CONSTRAINT room_inventory_item_type_check
  CHECK (item_type IN (
    'ac','fan','study_table','chair','wardrobe','desk_lamp',
    'refrigerator','tv','electric_kettle','microwave',
    'single_bed','mattress','other'
  ));

ALTER TABLE room_inventory
  ALTER COLUMN quantity DROP NOT NULL;

ALTER TABLE room_inventory
  DROP CONSTRAINT IF EXISTS room_inventory_quantity_check;

ALTER TABLE room_inventory
  ADD CONSTRAINT room_inventory_quantity_check
  CHECK (quantity IS NULL OR quantity >= 0);

COMMIT;
