<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$pdo = get_db();

function one($pdo, $sql, $params, $key = 'val') {
    $s = $pdo->prepare($sql);
    $s->execute($params);
    return $s->fetchColumn();
}

$today_in  = (int)one($pdo,
  'SELECT COUNT(*) FROM hotel_bookings
    WHERE hotel_id = ? AND check_in = CURDATE() AND status IN (\'confirmed\',\'pending\')', [$hotel_id]);

$today_out = (int)one($pdo,
  'SELECT COUNT(*) FROM hotel_bookings
    WHERE hotel_id = ? AND check_out = CURDATE() AND status IN (\'confirmed\',\'pending\',\'completed\')', [$hotel_id]);

$current_guests = (int)one($pdo,
  'SELECT COALESCE(SUM(guests), 0) FROM hotel_bookings
    WHERE hotel_id = ? AND status = \'confirmed\'
      AND check_in  <= CURDATE() AND check_out > CURDATE()', [$hotel_id]);

$month_revenue = (float)one($pdo,
  'SELECT COALESCE(SUM(total_amount), 0) FROM hotel_bookings
    WHERE hotel_id = ? AND status IN (\'confirmed\',\'completed\')
      AND MONTH(booked_at) = MONTH(CURDATE()) AND YEAR(booked_at) = YEAR(CURDATE())', [$hotel_id]);

$month_bookings = (int)one($pdo,
  'SELECT COUNT(*) FROM hotel_bookings
    WHERE hotel_id = ? AND status != \'cancelled\'
      AND MONTH(booked_at) = MONTH(CURDATE()) AND YEAR(booked_at) = YEAR(CURDATE())', [$hotel_id]);

$upcoming = $pdo->prepare(
  'SELECT b.id, b.booking_code, b.booking_source, b.check_in, b.check_out, b.guests,
          b.total_amount, b.status, COALESCE(u.name, b.guest_name, \'Walk-in\') AS guest,
          r.room_type
   FROM hotel_bookings b
   JOIN hotel_rooms r ON r.id = b.room_id
   LEFT JOIN users u ON u.id = b.user_id
   WHERE b.hotel_id = ? AND b.status IN (\'pending\',\'confirmed\') AND b.check_out >= CURDATE()
   ORDER BY b.check_in ASC LIMIT 6');
$upcoming->execute([$hotel_id]);
$upcoming = $upcoming->fetchAll();

foreach ($upcoming as &$b) {
    $b['id']           = (int)$b['id'];
    $b['guests']       = (int)$b['guests'];
    $b['total_amount'] = (float)$b['total_amount'];
}

json_response([
    'stats' => [
        'today_checkins'  => $today_in,
        'today_checkouts' => $today_out,
        'current_guests'  => $current_guests,
        'month_revenue'   => $month_revenue,
        'month_bookings'  => $month_bookings,
    ],
    'upcoming' => $upcoming,
]);
