<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

$pdo = get_db();
$rows = $pdo->query('SELECT h.*,
                            (SELECT COUNT(*) FROM hotel_rooms r WHERE r.hotel_id = h.id) AS room_count,
                            (SELECT COUNT(*) FROM hotel_bookings b WHERE b.hotel_id = h.id) AS booking_count
                     FROM hotels h
                     ORDER BY h.created_at DESC')->fetchAll();

foreach ($rows as &$h) {
    $h['id']                 = (int)$h['id'];
    $h['star_rating']        = (int)$h['star_rating'];
    $h['user_rating']        = (float)$h['user_rating'];
    $h['commission_percent'] = (float)($h['commission_percent'] ?? 0);
    $h['is_active']          = (bool)$h['is_active'];
    $h['room_count']         = (int)$h['room_count'];
    $h['booking_count']      = (int)$h['booking_count'];
}

json_response(['hotels' => $rows]);
