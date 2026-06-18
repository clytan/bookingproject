-- =============================================================
-- Migration: add property_type to hotels
-- Run AFTER hotels.sql. Safe to re-run — uses INFORMATION_SCHEMA
-- to add the column only if it doesn't exist.
-- =============================================================

USE busgo_db;

-- Add property_type column if it doesn't already exist
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'hotels'
    AND COLUMN_NAME  = 'property_type'
);

SET @sql := IF(@col_exists = 0,
  "ALTER TABLE hotels
     ADD COLUMN property_type
       ENUM('hotel','resort','service_apartment','independent_house',
            'villa','guest_house','hostel','boutique_hotel','apartment')
       NOT NULL DEFAULT 'hotel'
       AFTER city,
     ADD INDEX idx_property_type (property_type)",
  "SELECT 'property_type column already exists' AS status"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill seed hotels with sensible types (only if still on default 'hotel')
UPDATE hotels SET property_type = 'hotel'             WHERE id = 1 AND property_type = 'hotel';
UPDATE hotels SET property_type = 'resort'            WHERE id = 2 AND property_type = 'hotel';
UPDATE hotels SET property_type = 'boutique_hotel'    WHERE id = 3 AND property_type = 'hotel';
UPDATE hotels SET property_type = 'resort'            WHERE id = 4 AND property_type = 'hotel';
UPDATE hotels SET property_type = 'hotel'             WHERE id = 5 AND property_type = 'hotel';
UPDATE hotels SET property_type = 'boutique_hotel'    WHERE id = 6 AND property_type = 'hotel';
UPDATE hotels SET property_type = 'resort'            WHERE id = 7 AND property_type = 'hotel';
UPDATE hotels SET property_type = 'hotel'             WHERE id = 8 AND property_type = 'hotel';
