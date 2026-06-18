-- =============================================================
-- Refactor: operator owns MANY activities (water sports company)
--   - Add water_activities.operator_id (nullable, FK -> activity_operators)
--   - Backfill from existing activity_operators.activity_id
--   - Drop activity_operators.activity_id and its index
-- Safe to re-run.
-- =============================================================

USE busgo_db;

-- 1. Add operator_id to water_activities if missing
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'water_activities'
    AND COLUMN_NAME  = 'operator_id'
);
SET @sql := IF(@col_exists = 0,
  "ALTER TABLE water_activities
     ADD COLUMN operator_id INT NULL AFTER city,
     ADD INDEX idx_operator (operator_id),
     ADD CONSTRAINT fk_activity_operator
       FOREIGN KEY (operator_id) REFERENCES activity_operators(id)
       ON DELETE SET NULL",
  "SELECT 'operator_id column already exists' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Backfill: copy activity_operators.activity_id -> water_activities.operator_id
--    only if old column still exists
SET @old_col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'activity_operators'
    AND COLUMN_NAME  = 'activity_id'
);
SET @sql := IF(@old_col_exists = 1,
  "UPDATE water_activities a
     JOIN activity_operators o ON o.activity_id = a.id
     SET a.operator_id = o.id
   WHERE a.operator_id IS NULL",
  "SELECT 'old activity_id column already dropped' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Drop the FK on activity_operators.activity_id, then the column, then the index.
--    Inspect FK name dynamically.
SET @fk_name := (
  SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'activity_operators'
    AND COLUMN_NAME  = 'activity_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @sql := IF(@fk_name IS NOT NULL,
  CONCAT("ALTER TABLE activity_operators DROP FOREIGN KEY ", @fk_name),
  "SELECT 'no FK on activity_operators.activity_id' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'activity_operators'
    AND INDEX_NAME   = 'idx_activity'
);
SET @sql := IF(@idx_exists = 1,
  "ALTER TABLE activity_operators DROP INDEX idx_activity",
  "SELECT 'idx_activity already dropped' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := IF(@old_col_exists = 1,
  "ALTER TABLE activity_operators DROP COLUMN activity_id",
  "SELECT 'activity_id column already dropped' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
