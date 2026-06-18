-- =============================================================
-- BusGo - MySQL schema
-- Paste this into phpMyAdmin > SQL tab, OR import the file.
-- =============================================================

CREATE DATABASE IF NOT EXISTS busgo_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE busgo_db;

-- -------------------------------------------------------------
-- Admin users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  role          ENUM('super_admin','admin','staff') NOT NULL DEFAULT 'admin',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  last_login    DATETIME NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- End users (passengers)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(120) NOT NULL UNIQUE,
  phone         VARCHAR(20)  NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Bus operators / fleet
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS buses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  bus_number   VARCHAR(30) NOT NULL UNIQUE,
  operator     VARCHAR(120) NOT NULL,
  bus_type     ENUM('ac','non_ac','sleeper','semi_sleeper') NOT NULL DEFAULT 'ac',
  total_seats  INT NOT NULL,
  amenities    VARCHAR(255) NULL,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Routes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS routes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  from_city     VARCHAR(80) NOT NULL,
  to_city       VARCHAR(80) NOT NULL,
  distance_km   INT NULL,
  duration_min  INT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uk_route (from_city, to_city)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Trip schedules
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedules (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  bus_id          INT NOT NULL,
  route_id        INT NOT NULL,
  departure_date  DATE NOT NULL,
  departure_time  TIME NOT NULL,
  arrival_time    TIME NOT NULL,
  fare            DECIMAL(10,2) NOT NULL,
  seats_available INT NOT NULL,
  status          ENUM('scheduled','running','completed','cancelled') DEFAULT 'scheduled',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id)   REFERENCES buses(id)  ON DELETE CASCADE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  INDEX idx_search (route_id, departure_date)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Bookings
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  booking_code  VARCHAR(20) NOT NULL UNIQUE,
  user_id       INT NOT NULL,
  schedule_id   INT NOT NULL,
  seat_numbers  VARCHAR(255) NOT NULL,
  passenger_count INT NOT NULL,
  total_amount  DECIMAL(10,2) NOT NULL,
  status        ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  booked_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Payments
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  booking_id     INT NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  method         ENUM('card','bank','cash','wallet') NOT NULL,
  transaction_id VARCHAR(100) NULL,
  status         ENUM('pending','success','failed','refunded') DEFAULT 'pending',
  paid_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Sample data (optional — handy for testing the dashboard)
-- -------------------------------------------------------------
INSERT IGNORE INTO routes (from_city, to_city, distance_km, duration_min) VALUES
  ('Colombo', 'Kandy',         115, 210),
  ('Colombo', 'Galle',         120, 135),
  ('Colombo', 'Jaffna',        400, 480),
  ('Kandy',   'Nuwara Eliya',   78, 120),
  ('Colombo', 'Anuradhapura',  205, 330),
  ('Galle',   'Matara',         45,  60);

INSERT IGNORE INTO buses (bus_number, operator, bus_type, total_seats, amenities) VALUES
  ('NC-1234', 'Maharaja Express', 'ac',          45, 'WiFi, USB charging, AC, Water'),
  ('NA-5678', 'Super Line',       'semi_sleeper',40, 'AC, Reclining seats'),
  ('WP-9012', 'Royal Coach',      'sleeper',     30, 'WiFi, AC, Blanket, Snacks');
