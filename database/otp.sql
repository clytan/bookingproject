-- =============================================================
-- Email OTP login/signup
--   - otp_codes: short-lived 6-digit codes keyed by email
--   - users.email_verified: flag set when OTP succeeds
--   - users.password_hash: NULLABLE so passwordless email-OTP signups work
-- Safe to re-run.
-- =============================================================

USE busgo_db;

-- Drop the old phone-based otp_codes if it exists (test data only)
DROP TABLE IF EXISTS otp_codes;

CREATE TABLE otp_codes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(120) NOT NULL,
  code        VARCHAR(10)  NOT NULL,
  purpose     ENUM('login','signup') NOT NULL,
  attempts    TINYINT NOT NULL DEFAULT 0,
  used        TINYINT(1) NOT NULL DEFAULT 0,
  expires_at  DATETIME NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_purpose (email, purpose),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB;

-- Add email_verified to users if missing
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'users'
    AND COLUMN_NAME  = 'email_verified'
);
SET @sql := IF(@col_exists = 0,
  "ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER email",
  "SELECT 'email_verified already exists' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Make password_hash nullable so passwordless signups don't require a password
SET @nullable := (
  SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'
);
SET @sql := IF(@nullable = 'NO',
  "ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL",
  "SELECT 'password_hash already nullable' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Clean up the leftover phone_verified column from the WhatsApp attempt (optional, idempotent)
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_verified'
);
SET @sql := IF(@col_exists = 1,
  "ALTER TABLE users DROP COLUMN phone_verified",
  "SELECT 'phone_verified already absent' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop the phone unique index too (added during WhatsApp work)
SET @idx_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'uk_users_phone'
);
SET @sql := IF(@idx_exists = 1,
  "ALTER TABLE users DROP INDEX uk_users_phone",
  "SELECT 'uk_users_phone already absent' AS status"
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
