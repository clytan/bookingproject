-- =============================================================
-- Hotels module — adds hotels, hotel_rooms, hotel_bookings
-- Run this AFTER schema.sql. Safe to re-run (uses IF NOT EXISTS / INSERT IGNORE).
-- =============================================================

USE busgo_db;

CREATE TABLE IF NOT EXISTS hotels (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  city        VARCHAR(80)  NOT NULL,
  address     VARCHAR(255) NULL,
  description TEXT NULL,
  star_rating TINYINT NOT NULL DEFAULT 3,
  user_rating DECIMAL(2,1) NOT NULL DEFAULT 4.0,
  image_url   VARCHAR(500) NULL,
  amenities   VARCHAR(500) NULL,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city (city),
  INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hotel_rooms (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  hotel_id        INT NOT NULL,
  room_type       VARCHAR(80) NOT NULL,
  description     VARCHAR(255) NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  capacity        INT NOT NULL DEFAULT 2,
  total_rooms     INT NOT NULL DEFAULT 1,
  image_url       VARCHAR(500) NULL,
  amenities       VARCHAR(500) NULL,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotel (hotel_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hotel_bookings (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  booking_code   VARCHAR(20) NOT NULL UNIQUE,
  user_id        INT NOT NULL,
  hotel_id       INT NOT NULL,
  room_id        INT NOT NULL,
  check_in       DATE NOT NULL,
  check_out      DATE NOT NULL,
  nights         INT NOT NULL,
  guests         INT NOT NULL DEFAULT 1,
  total_amount   DECIMAL(10,2) NOT NULL,
  status         ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  booked_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)        ON DELETE CASCADE,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id)       ON DELETE CASCADE,
  FOREIGN KEY (room_id)  REFERENCES hotel_rooms(id)  ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Sample hotels (Sri Lankan destinations)
-- -------------------------------------------------------------
INSERT IGNORE INTO hotels (id, name, city, address, description, star_rating, user_rating, image_url, amenities) VALUES
  (1, 'Cinnamon Grand Colombo', 'Colombo', '77 Galle Road, Colombo 03',
      'Iconic 5-star hotel in the heart of the capital with world-class dining and a rooftop pool.',
      5, 4.7, 'https://picsum.photos/seed/hotel-1/800/600',
      'Free WiFi, Pool, Spa, Gym, Restaurant, Bar, Airport shuttle'),
  (2, 'Earl''s Regency Kandy', 'Kandy', 'Tennekumbura, Kandy',
      'Hillside retreat overlooking the Mahaweli river. Panoramic mountain views.',
      5, 4.6, 'https://picsum.photos/seed/hotel-2/800/600',
      'Free WiFi, Pool, Spa, Restaurant, Lake view, Free parking'),
  (3, 'Jetwing Lighthouse Galle', 'Galle', 'Dadella, Galle',
      'Boutique seafront hotel inspired by the Galle Lighthouse. Romantic ocean sunsets.',
      5, 4.8, 'https://picsum.photos/seed/hotel-3/800/600',
      'Free WiFi, Beach access, 2 Pools, Spa, Restaurant, Bar'),
  (4, 'Heritance Tea Factory Nuwara Eliya', 'Nuwara Eliya', 'Kandapola, Nuwara Eliya',
      'Converted tea factory at 6,800 ft. Tea trails, cool weather and colonial charm.',
      5, 4.5, 'https://picsum.photos/seed/hotel-4/800/600',
      'Free WiFi, Restaurant, Tea factory tours, Heating, Garden'),
  (5, 'Galle Face Hotel Colombo', 'Colombo', '2 Galle Road, Colombo 03',
      'Historic colonial-era hotel facing the Indian Ocean. Built in 1864.',
      5, 4.4, 'https://picsum.photos/seed/hotel-5/800/600',
      'Free WiFi, Pool, Spa, Multiple restaurants, Beach, Heritage tours'),
  (6, 'OZO Kandy', 'Kandy', '01 Saranankara Road, Kandy',
      'Modern boutique hotel near the Temple of the Tooth.',
      4, 4.2, 'https://picsum.photos/seed/hotel-6/800/600',
      'Free WiFi, Rooftop pool, Restaurant, Lake view'),
  (7, 'Anantara Peace Haven Tangalle', 'Tangalle', 'Goyambokka, Tangalle',
      'Luxury cliff-top resort on a private beach.',
      5, 4.9, 'https://picsum.photos/seed/hotel-7/800/600',
      'Free WiFi, Private beach, Spa, Multiple pools, 4 Restaurants'),
  (8, 'Citrus Hikkaduwa', 'Hikkaduwa', '400 Galle Road, Hikkaduwa',
      'Beachfront hotel popular with surfers and snorkellers.',
      4, 4.1, 'https://picsum.photos/seed/hotel-8/800/600',
      'Free WiFi, Beach access, Pool, Restaurant, Water sports');

-- Rooms
INSERT IGNORE INTO hotel_rooms (hotel_id, room_type, description, price_per_night, capacity, total_rooms, image_url, amenities) VALUES
  (1, 'Deluxe Room',      'City-view room with king bed',                15000, 2, 20, 'https://picsum.photos/seed/room-1-1/600/400', 'AC, TV, Mini bar, Safe'),
  (1, 'Executive Suite',  'Spacious suite with separate living area',    32000, 3, 10, 'https://picsum.photos/seed/room-1-2/600/400', 'AC, TV, Mini bar, Lounge access, Bathtub'),
  (2, 'Superior Room',    'Mountain-view with twin beds',                12000, 2, 25, 'https://picsum.photos/seed/room-2-1/600/400', 'AC, TV, Balcony'),
  (2, 'Family Suite',     'Two bedrooms with valley views',              22000, 4, 8,  'https://picsum.photos/seed/room-2-2/600/400', 'AC, TV, 2 bedrooms, Living room'),
  (3, 'Ocean View Room',  'King bed, full ocean view',                   18000, 2, 30, 'https://picsum.photos/seed/room-3-1/600/400', 'AC, TV, Sea view, Balcony'),
  (3, 'Lighthouse Suite', 'Premium suite at the top of the hotel',       45000, 2, 4,  'https://picsum.photos/seed/room-3-2/600/400', 'AC, TV, Jacuzzi, Lounge, Butler'),
  (4, 'Tea Plucker Room', 'Cozy room in original factory wing',          14000, 2, 15, 'https://picsum.photos/seed/room-4-1/600/400', 'Heating, TV, Garden view'),
  (4, 'Manager Suite',    'Top-floor suite with 360° views',             28000, 3, 6,  'https://picsum.photos/seed/room-4-2/600/400', 'Heating, TV, Sitting area, Mountain view'),
  (5, 'Classic Room',     'Colonial-style room with garden view',        16000, 2, 18, 'https://picsum.photos/seed/room-5-1/600/400', 'AC, TV, Heritage decor'),
  (5, 'Ocean Suite',      'Sweeping Indian Ocean views',                 38000, 3, 8,  'https://picsum.photos/seed/room-5-2/600/400', 'AC, TV, Lounge, Sea view'),
  (6, 'Smart Room',       'Modern room with smart TV and lake glimpse',  9000,  2, 30, 'https://picsum.photos/seed/room-6-1/600/400', 'AC, Smart TV, USB charging'),
  (6, 'Family Room',      'Two queen beds for families',                 14000, 4, 12, 'https://picsum.photos/seed/room-6-2/600/400', 'AC, TV, 2 queen beds'),
  (7, 'Ocean Pool Villa', 'Private villa with pool overlooking ocean',   65000, 2, 8,  'https://picsum.photos/seed/room-7-1/600/400', 'Private pool, Butler, AC, Lounge'),
  (7, 'Beachfront Suite', 'Direct beach access suite',                   48000, 2, 12, 'https://picsum.photos/seed/room-7-2/600/400', 'Beach access, AC, Outdoor shower'),
  (8, 'Beach Room',       'Steps from the sand',                         7500,  2, 25, 'https://picsum.photos/seed/room-8-1/600/400', 'AC, TV, Balcony'),
  (8, 'Family Beach Room','Larger room sleeps 4',                        11000, 4, 10, 'https://picsum.photos/seed/room-8-2/600/400', 'AC, TV, Balcony, Sofa bed');
