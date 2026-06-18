<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');

$payload = require_user_auth();
$user_id = (int)$payload['sub'];

$pdo = get_db();
$stmt = $pdo->prepare(
  'SELECT b.id, b.booking_code, b.check_in, b.check_out, b.nights, b.guests,
          b.total_amount, b.status, b.booked_at,
          h.id AS hotel_id, h.name AS hotel_name, h.city, h.image_url,
          r.room_type
   FROM hotel_bookings b
   JOIN hotels h      ON h.id = b.hotel_id
   JOIN hotel_rooms r ON r.id = b.room_id
   WHERE b.user_id = ?
   ORDER BY b.booked_at DESC');
$stmt->execute([$user_id]);
$rows = $stmt->fetchAll();

foreach ($rows as &$b) {
    $b['id']           = (int)$b['id'];
    $b['hotel_id']     = (int)$b['hotel_id'];
    $b['nights']       = (int)$b['nights'];
    $b['guests']       = (int)$b['guests'];
    $b['total_amount'] = (float)$b['total_amount'];
}

json_response(['bookings' => $rows]);
