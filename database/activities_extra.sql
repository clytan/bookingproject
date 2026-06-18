-- =============================================================
-- Extra activities + slots for existing operators.
-- Each operator (water sports company) gets 2-3 extra activities, often across multiple cities.
-- Safe to re-run: INSERTs are guarded by NOT EXISTS check on (operator_id, name).
-- =============================================================

USE busgo_db;

-- Helper procedure pattern: insert activity only if (operator_id, name) doesn't exist,
-- then add slots only if the activity has zero slots yet.
DELIMITER //
DROP PROCEDURE IF EXISTS add_activity//
CREATE PROCEDURE add_activity(
  IN p_operator_id INT, IN p_name VARCHAR(150), IN p_city VARCHAR(80),
  IN p_category VARCHAR(40), IN p_description TEXT, IN p_difficulty VARCHAR(20),
  IN p_duration INT, IN p_rating DECIMAL(2,1), IN p_image VARCHAR(500), IN p_includes VARCHAR(500)
)
BEGIN
  DECLARE existing_id INT DEFAULT NULL;
  SELECT id INTO existing_id FROM water_activities
   WHERE operator_id = p_operator_id AND name = p_name LIMIT 1;
  IF existing_id IS NULL THEN
    INSERT INTO water_activities (name, city, operator_id, category, address, description,
      difficulty, duration_min, user_rating, image_url, includes, is_active)
    VALUES (p_name, p_city, p_operator_id, p_category, NULL, p_description,
            p_difficulty, p_duration, p_rating, p_image, p_includes, 1);
  END IF;
END//

DROP PROCEDURE IF EXISTS add_slot//
CREATE PROCEDURE add_slot(
  IN p_operator_id INT, IN p_activity_name VARCHAR(150),
  IN p_label VARCHAR(80), IN p_description VARCHAR(255),
  IN p_time TIME, IN p_duration INT, IN p_price DECIMAL(10,2),
  IN p_max INT, IN p_image VARCHAR(500), IN p_includes VARCHAR(500)
)
BEGIN
  DECLARE act_id INT DEFAULT NULL;
  DECLARE slot_exists INT DEFAULT 0;
  SELECT id INTO act_id FROM water_activities
   WHERE operator_id = p_operator_id AND name = p_activity_name LIMIT 1;
  IF act_id IS NOT NULL THEN
    SELECT COUNT(*) INTO slot_exists FROM activity_slots
      WHERE activity_id = act_id AND slot_label = p_label;
    IF slot_exists = 0 THEN
      INSERT INTO activity_slots (activity_id, slot_label, description, departure_time,
        duration_min, price_per_person, max_persons, image_url, includes, is_active)
      VALUES (act_id, p_label, p_description, p_time, p_duration, p_price, p_max, p_image, p_includes, 1);
    END IF;
  END IF;
END//
DELIMITER ;

-- =============================================================
-- Operator 1 — Grande Island Snorkeling Trip (Goa)
-- Extra activities: jet ski Baga, parasailing Calangute, snorkeling Andaman
-- =============================================================
CALL add_activity(1, 'Baga Beach Jet Ski Combo', 'Goa', 'jet_ski',
  '15-minute jet ski plus banana boat package for one all-action morning.',
  'beginner', 45, 4.5, 'https://picsum.photos/seed/op1-jetski/800/600',
  'Jet ski, Banana boat, Life jacket, Briefing');
CALL add_slot(1, 'Baga Beach Jet Ski Combo', 'Morning Combo', 'Jet ski 10am + banana boat 10:30am',
  '10:00:00', 45, 1800, 4, 'https://picsum.photos/seed/op1-jetski-1/600/400', 'Both rides');
CALL add_slot(1, 'Baga Beach Jet Ski Combo', 'Afternoon Combo', 'Jet ski 2pm + banana boat 2:30pm',
  '14:00:00', 45, 1900, 4, 'https://picsum.photos/seed/op1-jetski-2/600/400', 'Both rides');

CALL add_activity(1, 'Calangute Tandem Parasailing', 'Goa', 'parasailing',
  'Tandem parasail 200ft above the Arabian Sea — incredible coastline views.',
  'beginner', 30, 4.6, 'https://picsum.photos/seed/op1-para/800/600',
  'Parachute, Harness, Speedboat, Crew, Briefing');
CALL add_slot(1, 'Calangute Tandem Parasailing', 'Morning Flight', 'Calm winds, smooth ride',
  '10:30:00', 30, 2400, 2, 'https://picsum.photos/seed/op1-para-1/600/400', 'Tandem');
CALL add_slot(1, 'Calangute Tandem Parasailing', 'Sunset Flight', 'Golden-hour magic',
  '16:30:00', 30, 2800, 2, 'https://picsum.photos/seed/op1-para-2/600/400', 'Tandem + photos');

CALL add_activity(1, 'Havelock Coral Snorkel Day Trip', 'Havelock', 'snorkeling',
  'Boat to multiple coral spots around Havelock with all gear and lunch included.',
  'beginner', 360, 4.8, 'https://picsum.photos/seed/op1-snork2/800/600',
  'Snorkel gear, Lunch, Boat, Guide, Underwater photos');
CALL add_slot(1, 'Havelock Coral Snorkel Day Trip', 'Full Day', 'Boat leaves 8am, back 4pm',
  '08:00:00', 480, 3400, 20, 'https://picsum.photos/seed/op1-snork2-1/600/400', 'Lunch + photos');

-- =============================================================
-- Operator 2 — Havelock PADI Discover Scuba (Andaman)
-- Extra activities: certified scuba in Neil, snorkeling, kayaking
-- =============================================================
CALL add_activity(2, 'Neil Island Reef Dive', 'Neil Island', 'scuba_diving',
  'Certified-diver fun dive on Neil Island reefs. Bring your C-card.',
  'intermediate', 240, 4.9, 'https://picsum.photos/seed/op2-neil/800/600',
  'Tank, Weights, Boat, Dive guide');
CALL add_slot(2, 'Neil Island Reef Dive', 'Morning Fun Dive', 'Two-tank dive for certified divers',
  '07:30:00', 240, 5800, 8, 'https://picsum.photos/seed/op2-neil-1/600/400', '2 tanks');
CALL add_slot(2, 'Neil Island Reef Dive', 'Afternoon Fun Dive', 'Single-tank afternoon dive',
  '13:30:00', 180, 3800, 8, 'https://picsum.photos/seed/op2-neil-2/600/400', '1 tank');

CALL add_activity(2, 'Havelock Beach Snorkel Walk', 'Havelock', 'snorkeling',
  'Guided snorkel walk from Beach #3, perfect for beginners.',
  'beginner', 90, 4.5, 'https://picsum.photos/seed/op2-snork/800/600',
  'Snorkel gear, Guide');
CALL add_slot(2, 'Havelock Beach Snorkel Walk', 'Morning Walk', 'Best visibility window',
  '08:00:00', 90, 1200, 12, 'https://picsum.photos/seed/op2-snork-1/600/400', 'Gear');
CALL add_slot(2, 'Havelock Beach Snorkel Walk', 'Late Morning Walk', 'For slow risers',
  '10:30:00', 90, 1200, 12, 'https://picsum.photos/seed/op2-snork-2/600/400', 'Gear');

CALL add_activity(2, 'Andaman Mangrove Kayak', 'Andaman', 'kayaking',
  'Sunrise paddle through the Andaman mangroves with a naturalist guide.',
  'beginner', 150, 4.7, 'https://picsum.photos/seed/op2-kayak/800/600',
  'Kayak, Paddle, Life jacket, Guide, Snacks');
CALL add_slot(2, 'Andaman Mangrove Kayak', 'Sunrise Paddle', 'Birdwatching at dawn',
  '05:30:00', 150, 1600, 10, 'https://picsum.photos/seed/op2-kayak-1/600/400', 'Snacks');

-- =============================================================
-- Operator 3 — Arambol Surfing Lessons (Goa)
-- Extra activities: SUP, beginner board rental, advanced lessons
-- =============================================================
CALL add_activity(3, 'Mandrem SUP Class', 'Goa', 'surfing',
  'Stand-up paddleboarding for beginners on the calm Mandrem river-mouth.',
  'beginner', 90, 4.4, 'https://picsum.photos/seed/op3-sup/800/600',
  'Board, Paddle, Leash, Coach');
CALL add_slot(3, 'Mandrem SUP Class', 'Sunrise SUP', 'Glassy water, no wind',
  '06:30:00', 90, 1400, 8, 'https://picsum.photos/seed/op3-sup-1/600/400', 'Board + coach');
CALL add_slot(3, 'Mandrem SUP Class', 'Afternoon SUP', 'A bit more breeze, fun!',
  '15:30:00', 90, 1400, 8, 'https://picsum.photos/seed/op3-sup-2/600/400', 'Board + coach');

CALL add_activity(3, 'Arambol Advanced Surf Coaching', 'Goa', 'surfing',
  'Small-group coaching for intermediate surfers ready to advance to bigger boards.',
  'intermediate', 150, 4.7, 'https://picsum.photos/seed/op3-adv/800/600',
  'Performance board, Video review, Coach');
CALL add_slot(3, 'Arambol Advanced Surf Coaching', 'Morning Squad', 'Max 4 per coach',
  '07:00:00', 150, 3200, 4, 'https://picsum.photos/seed/op3-adv-1/600/400', '2.5hr session');

-- =============================================================
-- Operator 4 — Baga Beach Jet Ski Ride (Goa)
-- Extra activities: banana boat, bumper ride, speedboat tour
-- =============================================================
CALL add_activity(4, 'Baga Banana Boat Splash', 'Goa', 'banana_boat',
  'Group banana boat ride pulled by speedboat — great for friends and families.',
  'beginner', 20, 4.3, 'https://picsum.photos/seed/op4-bb/800/600',
  'Banana boat, Life jacket, Speedboat');
CALL add_slot(4, 'Baga Banana Boat Splash', 'Group Ride', 'Up to 6 people',
  '11:00:00', 20, 600, 6, 'https://picsum.photos/seed/op4-bb-1/600/400', 'Boat');

CALL add_activity(4, 'Baga Bumper Tube Ride', 'Goa', 'banana_boat',
  'Two-seat inflatable bumper towed at high speed — pure adrenaline.',
  'beginner', 15, 4.4, 'https://picsum.photos/seed/op4-bump/800/600',
  'Bumper, Speedboat, Life jacket');
CALL add_slot(4, 'Baga Bumper Tube Ride', 'Hourly Ride', 'Multiple slots each hour',
  '11:30:00', 15, 800, 2, 'https://picsum.photos/seed/op4-bump-1/600/400', 'Ride only');

CALL add_activity(4, 'Calangute Speedboat Joyride', 'Goa', 'jet_ski',
  '20-minute high-speed coastline tour aboard a 6-seater speedboat.',
  'beginner', 20, 4.2, 'https://picsum.photos/seed/op4-sb/800/600',
  'Speedboat, Life jacket');
CALL add_slot(4, 'Calangute Speedboat Joyride', 'Hourly', 'Every hour, 6 seats',
  '10:00:00', 20, 700, 6, 'https://picsum.photos/seed/op4-sb-1/600/400', 'Joyride');

-- =============================================================
-- Operator 5 — Backwater Kayaking Mangroves (Pondicherry)
-- Extra activities: sea kayaking, sunset cruise, double kayak
-- =============================================================
CALL add_activity(5, 'Pondicherry Sea Kayak', 'Pondicherry', 'kayaking',
  'Open-sea kayak from Promenade Beach with a safety boat shadowing.',
  'intermediate', 120, 4.5, 'https://picsum.photos/seed/op5-sea/800/600',
  'Kayak, Paddle, Life jacket, Safety boat');
CALL add_slot(5, 'Pondicherry Sea Kayak', 'Morning Paddle', 'Glassy sea conditions',
  '06:30:00', 120, 1800, 8, 'https://picsum.photos/seed/op5-sea-1/600/400', 'Paddle');

CALL add_activity(5, 'Auroville Catamaran Sunset', 'Pondicherry', 'catamaran_sailing',
  'Two-hour sail along the Pondicherry coast at sunset, with snacks and music.',
  'beginner', 120, 4.7, 'https://picsum.photos/seed/op5-cat/800/600',
  'Catamaran, Snacks, Soft drinks, Captain');
CALL add_slot(5, 'Auroville Catamaran Sunset', 'Sunset Sail', 'Daily at 5pm',
  '17:00:00', 120, 2800, 16, 'https://picsum.photos/seed/op5-cat-1/600/400', 'Snacks');

CALL add_activity(5, 'Chennai Backwater Day Trip', 'Chennai', 'kayaking',
  'Drive out to the Muttukadu backwaters for a full-day kayaking experience.',
  'beginner', 480, 4.4, 'https://picsum.photos/seed/op5-chen/800/600',
  'Transport, Kayak, Lunch, Guide');
CALL add_slot(5, 'Chennai Backwater Day Trip', 'Full Day', 'Pickup 7am, drop 5pm',
  '07:00:00', 600, 3600, 8, 'https://picsum.photos/seed/op5-chen-1/600/400', 'Day trip');

-- =============================================================
-- Operator 6 — Mirissa Blue Whale Watching (Andaman)
-- Extra activities: dolphin trip, sunset cruise, fishing
-- =============================================================
CALL add_activity(6, 'Andaman Dolphin Spotting Trip', 'Andaman', 'whale_watching',
  'Half-day boat trip to spot dolphins, flying fish and occasional whale sharks.',
  'beginner', 180, 4.5, 'https://picsum.photos/seed/op6-dolph/800/600',
  'Boat, Breakfast, Spotter guide');
CALL add_slot(6, 'Andaman Dolphin Spotting Trip', 'Early Morning', 'Boat leaves 6am',
  '06:00:00', 180, 2600, 18, 'https://picsum.photos/seed/op6-dolph-1/600/400', 'Breakfast');

CALL add_activity(6, 'Port Blair Sunset Cruise', 'Andaman', 'catamaran_sailing',
  'Relaxed sunset cruise across Port Blair harbour with live acoustic music.',
  'beginner', 90, 4.6, 'https://picsum.photos/seed/op6-sunset/800/600',
  'Cruise, Snacks, Music');
CALL add_slot(6, 'Port Blair Sunset Cruise', 'Sunset', 'Daily at 5:30pm',
  '17:30:00', 90, 2200, 25, 'https://picsum.photos/seed/op6-sunset-1/600/400', 'Snacks');

-- =============================================================
-- Operator 7 — Calangute Banana Boat Splash (Goa)
-- Extra activities: ringo ride, jet ski, bumper
-- =============================================================
CALL add_activity(7, 'Calangute Ringo Ride', 'Goa', 'banana_boat',
  'Circular inflatable ringo towed at speed. 4-person seats.',
  'beginner', 15, 4.2, 'https://picsum.photos/seed/op7-ringo/800/600',
  'Ringo, Speedboat, Life jacket');
CALL add_slot(7, 'Calangute Ringo Ride', 'Hourly', 'Multiple slots',
  '11:00:00', 15, 750, 4, 'https://picsum.photos/seed/op7-ringo-1/600/400', 'Ride');

CALL add_activity(7, 'Sinquerim Jet Ski Solo', 'Goa', 'jet_ski',
  'Drive your own jet ski for 15 minutes off Sinquerim Beach.',
  'beginner', 15, 4.3, 'https://picsum.photos/seed/op7-jet/800/600',
  'Jet ski, Life jacket, Briefing');
CALL add_slot(7, 'Sinquerim Jet Ski Solo', 'Per Ride', 'On-demand',
  '10:00:00', 15, 1500, 1, 'https://picsum.photos/seed/op7-jet-1/600/400', 'Solo');

-- =============================================================
-- Operator 8 — Candolim Parasailing Sky Ride (Goa)
-- Extra activities: solo parasail, sunset flight
-- =============================================================
CALL add_activity(8, 'Candolim Solo Parasail', 'Goa', 'parasailing',
  'Fly solo at 200ft. Brave riders only.',
  'beginner', 25, 4.4, 'https://picsum.photos/seed/op8-solo/800/600',
  'Parachute, Speedboat, Crew');
CALL add_slot(8, 'Candolim Solo Parasail', 'Morning Solo', 'Calm winds',
  '10:30:00', 25, 1800, 1, 'https://picsum.photos/seed/op8-solo-1/600/400', 'Solo');

CALL add_activity(8, 'Anjuna Sunset Parasail', 'Goa', 'parasailing',
  'Tandem parasail at sunset off the Anjuna coast.',
  'beginner', 30, 4.7, 'https://picsum.photos/seed/op8-sun/800/600',
  'Parachute, Crew, Sunset views');
CALL add_slot(8, 'Anjuna Sunset Parasail', 'Sunset Tandem', 'Golden hour',
  '17:30:00', 30, 2700, 2, 'https://picsum.photos/seed/op8-sun-1/600/400', 'Tandem');

-- =============================================================
-- Operator 9 — Sunset Catamaran Cruise (Pondicherry)
-- Extra activities: morning sail, full-moon cruise, private charter
-- =============================================================
CALL add_activity(9, 'Pondicherry Morning Sail', 'Pondicherry', 'catamaran_sailing',
  'Two-hour morning sail with breakfast and coffee on board.',
  'beginner', 120, 4.5, 'https://picsum.photos/seed/op9-morn/800/600',
  'Catamaran, Breakfast, Coffee');
CALL add_slot(9, 'Pondicherry Morning Sail', 'Morning Sail', 'Daily at 7am',
  '07:00:00', 120, 2900, 16, 'https://picsum.photos/seed/op9-morn-1/600/400', 'Breakfast');

CALL add_activity(9, 'Full-Moon Catamaran Night', 'Pondicherry', 'catamaran_sailing',
  'Special monthly full-moon sail with dinner, drinks and live acoustic music.',
  'beginner', 180, 4.9, 'https://picsum.photos/seed/op9-moon/800/600',
  'Dinner, Drinks, Music');
CALL add_slot(9, 'Full-Moon Catamaran Night', 'Full Moon', 'Once a month',
  '19:30:00', 180, 5500, 20, 'https://picsum.photos/seed/op9-moon-1/600/400', 'Dinner + music');

-- Clean up
DROP PROCEDURE IF EXISTS add_activity;
DROP PROCEDURE IF EXISTS add_slot;
