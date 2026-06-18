-- =============================================================
-- Manager portal: hotel_managers + hotel_bookings refactor
-- Safe to re-run.
-- =============================================================

USE busgo_db;

-- -------------------------------------------------------------
-- Hotel managers (separate from admin_users)
-- A manager belongs to one hotel; a hotel can have many managers.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotel_managers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  hotel_id      INT NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  phone         VARCHAR(20)  NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login    DATETIME NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotel (hotel_id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- hotel_bookings: support walk-ins (no user account) and source tracking
-- -------------------------------------------------------------
ALTER TABLE hotel_bookings
  MODIFY user_id INT NULL;

ALTER TABLE hotel_bookings
  ADD COLUMN IF NOT EXISTS booking_source ENUM('user','manager') NOT NULL DEFAULT 'user' AFTER user_id,
  ADD COLUMN IF NOT EXISTS manager_id     INT NULL AFTER booking_source,
  ADD COLUMN IF NOT EXISTS guest_name     VARCHAR(120) NULL AFTER manager_id,
  ADD COLUMN IF NOT EXISTS guest_email    VARCHAR(120) NULL AFTER guest_name,
  ADD COLUMN IF NOT EXISTS guest_phone    VARCHAR(20)  NULL AFTER guest_email,
  ADD COLUMN IF NOT EXISTS notes          VARCHAR(500) NULL AFTER guest_phone;

-- FK for manager_id (use INFORMATION_SCHEMA check to keep it idempotent)
SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'hotel_bookings'
    AND CONSTRAINT_NAME = 'fk_hb_manager'
);
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE hotel_bookings ADD CONSTRAINT fk_hb_manager FOREIGN KEY (manager_id) REFERENCES hotel_managers(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Fast availability lookups
CREATE INDEX IF NOT EXISTS idx_room_dates  ON hotel_bookings (room_id, status, check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_hotel_dates ON hotel_bookings (hotel_id, status, check_in);

-- Manager users are seeded via /api/manager/seed.php (uses PHP's password_hash).
