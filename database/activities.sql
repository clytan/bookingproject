-- =============================================================
-- Water Activities module — adds water_activities, activity_slots,
-- activity_bookings, activity_operators.
-- Run AFTER hotels.sql. Safe to re-run (IF NOT EXISTS / INSERT IGNORE).
-- =============================================================

USE busgo_db;

CREATE TABLE IF NOT EXISTS activity_operators (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50) NOT NULL UNIQUE,
  email          VARCHAR(120) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(120) NOT NULL,
  phone          VARCHAR(40)  NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  last_login     DATETIME NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS water_activities (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  city         VARCHAR(80)  NOT NULL,
  operator_id  INT NULL,
  category     ENUM('snorkeling','scuba_diving','surfing','jet_ski','kayaking',
                    'whale_watching','banana_boat','parasailing','catamaran_sailing','other')
               NOT NULL DEFAULT 'other',
  address      VARCHAR(255) NULL,
  description  TEXT NULL,
  difficulty   ENUM('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  duration_min INT NOT NULL DEFAULT 60,
  user_rating  DECIMAL(2,1) NOT NULL DEFAULT 4.0,
  image_url    VARCHAR(500) NULL,
  includes     VARCHAR(500) NULL,
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (operator_id) REFERENCES activity_operators(id) ON DELETE SET NULL,
  INDEX idx_city (city),
  INDEX idx_category (category),
  INDEX idx_operator (operator_id),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_slots (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  activity_id      INT NOT NULL,
  slot_label       VARCHAR(80) NOT NULL,
  description      VARCHAR(255) NULL,
  departure_time   TIME NOT NULL,
  duration_min     INT NOT NULL DEFAULT 60,
  price_per_person DECIMAL(10,2) NOT NULL,
  max_persons      INT NOT NULL DEFAULT 10,
  image_url        VARCHAR(500) NULL,
  includes         VARCHAR(500) NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (activity_id) REFERENCES water_activities(id) ON DELETE CASCADE,
  INDEX idx_activity (activity_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_bookings (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  booking_code   VARCHAR(20) NOT NULL UNIQUE,
  user_id        INT NULL,
  guest_name     VARCHAR(120) NULL,
  guest_email    VARCHAR(120) NULL,
  guest_phone    VARCHAR(40)  NULL,
  activity_id    INT NOT NULL,
  slot_id        INT NOT NULL,
  activity_date  DATE NOT NULL,
  persons        INT NOT NULL DEFAULT 1,
  total_amount   DECIMAL(10,2) NOT NULL,
  status         ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  booking_source ENUM('user','operator') NOT NULL DEFAULT 'user',
  notes          VARCHAR(500) NULL,
  booked_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)             ON DELETE SET NULL,
  FOREIGN KEY (activity_id) REFERENCES water_activities(id)  ON DELETE CASCADE,
  FOREIGN KEY (slot_id)     REFERENCES activity_slots(id)    ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_activity_date (activity_id, activity_date),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- (activity_operators created above water_activities so the FK can resolve)

-- -------------------------------------------------------------
-- Sample water activities
-- -------------------------------------------------------------
INSERT IGNORE INTO water_activities (id, name, city, category, address, description, difficulty, duration_min, user_rating, image_url, includes) VALUES
  (1, 'Grande Island Snorkeling Trip',  'Goa',          'snorkeling',        'Vasco da Gama Jetty, Goa',
      'Boat ride to Grande Island with guided snorkeling around coral reefs. All gear provided. Lunch included.',
      'beginner', 360, 4.7, 'https://picsum.photos/seed/act-1/800/600',
      'Snorkel gear, Life jacket, Lunch, Boat ride, Guide'),
  (2, 'Havelock PADI Discover Scuba',   'Havelock',     'scuba_diving',      'Beach #3, Havelock Island, Andaman',
      'Try-dive for first timers. Certified PADI instructor. Crystal clear waters with rich marine life.',
      'beginner', 180, 4.9, 'https://picsum.photos/seed/act-2/800/600',
      'PADI instructor, All scuba gear, Boat ride, Underwater photos'),
  (3, 'Arambol Surfing Lessons',         'Goa',          'surfing',           'Arambol Beach, North Goa',
      'Two-hour learn-to-surf with ISA certified coaches. Soft-top boards and rash guards included.',
      'beginner', 120, 4.5, 'https://picsum.photos/seed/act-3/800/600',
      'Surfboard, Rash guard, Coach, 2hr session'),
  (4, 'Baga Beach Jet Ski Ride',         'Goa',          'jet_ski',           'Baga Beach, North Goa',
      'High-speed jet ski ride along Baga Beach. Solo or pillion. 15 minutes of pure adrenaline.',
      'beginner', 15, 4.3, 'https://picsum.photos/seed/act-4/800/600',
      'Jet ski, Life jacket, Safety briefing'),
  (5, 'Backwater Kayaking Mangroves',    'Pondicherry',  'kayaking',          'Auroville Beach Road, Pondicherry',
      'Sunrise kayaking through Pichavaram mangroves. Spot kingfishers and herons.',
      'beginner', 150, 4.6, 'https://picsum.photos/seed/act-5/800/600',
      'Kayak, Paddle, Life jacket, Guide, Breakfast'),
  (6, 'Mirissa Blue Whale Watching',     'Andaman',      'whale_watching',    'Port Blair Harbour, Andaman',
      'Half-day boat trip in search of blue whales, dolphins and flying fish.',
      'beginner', 240, 4.4, 'https://picsum.photos/seed/act-6/800/600',
      'Boat ride, Breakfast, Tea/coffee, Spotter guide'),
  (7, 'Calangute Banana Boat Splash',    'Goa',          'banana_boat',       'Calangute Beach, North Goa',
      'Group banana boat ride pulled by speedboat. Fun for groups and families.',
      'beginner', 20, 4.2, 'https://picsum.photos/seed/act-7/800/600',
      'Banana boat, Life jacket, Speedboat'),
  (8, 'Candolim Parasailing Sky Ride',   'Goa',          'parasailing',       'Candolim Beach, North Goa',
      'Tandem parasailing 200ft above the Arabian Sea. Stunning coastline views.',
      'beginner', 30, 4.5, 'https://picsum.photos/seed/act-8/800/600',
      'Parachute, Harness, Speedboat, Crew'),
  (9, 'Sunset Catamaran Cruise',         'Pondicherry',  'catamaran_sailing', 'Pondicherry Marina',
      'Two-hour sunset catamaran sail along the Pondicherry coast. Snacks and music on board.',
      'beginner', 120, 4.8, 'https://picsum.photos/seed/act-9/800/600',
      'Catamaran, Snacks, Soft drinks, Captain');

-- Slots (departures) — most activities have 2-3 daily slots
INSERT IGNORE INTO activity_slots (activity_id, slot_label, description, departure_time, duration_min, price_per_person, max_persons, image_url, includes) VALUES
  (1, 'Morning Trip',        'Boat leaves at 9am, back by 3pm',          '09:00:00', 360, 2200, 25, 'https://picsum.photos/seed/slot-1-1/600/400', 'Snorkel gear, Lunch'),
  (1, 'Afternoon Trip',      'Boat leaves at 12pm, back by 6pm',         '12:00:00', 360, 2400, 25, 'https://picsum.photos/seed/slot-1-2/600/400', 'Snorkel gear, Lunch'),
  (2, 'Morning Try-dive',    'Briefing 8am, dive 9am',                   '08:00:00', 180, 4500, 8,  'https://picsum.photos/seed/slot-2-1/600/400', 'PADI instructor, Gear'),
  (2, 'Afternoon Try-dive',  'Briefing 1pm, dive 2pm',                   '13:00:00', 180, 4800, 8,  'https://picsum.photos/seed/slot-2-2/600/400', 'PADI instructor, Gear, Photos'),
  (3, 'Sunrise Lesson',      'Best for beginners — calm waters',          '06:30:00', 120, 1800, 12, 'https://picsum.photos/seed/slot-3-1/600/400', 'Board, Coach'),
  (3, 'Evening Lesson',      'Smaller groups, golden hour',               '16:30:00', 120, 2000, 12, 'https://picsum.photos/seed/slot-3-2/600/400', 'Board, Coach'),
  (4, '15 min Solo Ride',    'Drive yourself',                           '10:00:00', 15,  1500, 1,  'https://picsum.photos/seed/slot-4-1/600/400', 'Jet ski'),
  (4, '15 min Pillion',      'Ride with instructor',                     '10:00:00', 15,  1000, 1,  'https://picsum.photos/seed/slot-4-2/600/400', 'Pillion only'),
  (5, 'Sunrise Kayak',       'Best birdwatching window',                 '05:30:00', 150, 1400, 15, 'https://picsum.photos/seed/slot-5-1/600/400', 'Kayak, Breakfast'),
  (5, 'Sunset Kayak',        'Evening paddle through mangroves',         '16:00:00', 150, 1300, 15, 'https://picsum.photos/seed/slot-5-2/600/400', 'Kayak'),
  (6, 'Half-day Trip',       'Boat 6am to 10am',                          '06:00:00', 240, 3200, 20, 'https://picsum.photos/seed/slot-6-1/600/400', 'Boat, Breakfast'),
  (7, '20 min Ride',         'Group of 4-6',                              '11:00:00', 20,  600,  6,  'https://picsum.photos/seed/slot-7-1/600/400', 'Banana boat'),
  (8, '10 min Tandem Sail',  'Two people in the air at once',             '10:30:00', 30,  2500, 2,  'https://picsum.photos/seed/slot-8-1/600/400', 'Parachute, Crew'),
  (8, '10 min Solo Sail',    'Solo flight',                               '14:30:00', 30,  1800, 1,  'https://picsum.photos/seed/slot-8-2/600/400', 'Parachute'),
  (9, 'Sunset Sail',         'Snacks + music on board',                   '17:00:00', 120, 3500, 20, 'https://picsum.photos/seed/slot-9-1/600/400', 'Catamaran, Snacks');
