-- =============================================================
-- Commission module
--   * commission_percent on hotels (per-property commission)
--   * commission_percent on activity_operators (per-company; applies
--     to every activity that operator owns)
--
-- Admin's share for a booking = total_amount * commission_percent / 100
-- Vendor payout              = total_amount - admin share
--
-- Run AFTER hotels.sql and activities.sql. Safe to re-run.
-- =============================================================

USE busgo_db;

-- ---- hotels.commission_percent --------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'hotels'
    AND COLUMN_NAME  = 'commission_percent'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE hotels
     ADD COLUMN commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0
     AFTER amenities',
  'SELECT "hotels.commission_percent already exists" AS info'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ---- activity_operators.commission_percent --------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'activity_operators'
    AND COLUMN_NAME  = 'commission_percent'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE activity_operators
     ADD COLUMN commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0
     AFTER phone',
  'SELECT "activity_operators.commission_percent already exists" AS info'
);
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed sane defaults so existing rows have a non-zero rate to play with
UPDATE hotels             SET commission_percent = 15.00 WHERE commission_percent = 0;
UPDATE activity_operators SET commission_percent = 12.00 WHERE commission_percent = 0;
