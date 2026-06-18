<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$pdo = get_db();
$stmt = $pdo->prepare('SELECT r.*,
                              (SELECT COUNT(*) FROM hotel_bookings b
                               WHERE b.room_id = r.id AND b.status IN (\'pending\',\'confirmed\')
                                 AND b.check_out > CURDATE()) AS upcoming_bookings
                       FROM hotel_rooms r
                       WHERE r.hotel_id = ?
                       ORDER BY r.price_per_night ASC');
$stmt->execute([$hotel_id]);
$rooms = $stmt->fetchAll();

foreach ($rooms as &$r) {
    $r['id']                = (int)$r['id'];
    $r['hotel_id']          = (int)$r['hotel_id'];
    $r['price_per_night']   = (float)$r['price_per_night'];
    $r['capacity']          = (int)$r['capacity'];
    $r['total_rooms']       = (int)$r['total_rooms'];
    $r['is_active']         = (bool)$r['is_active'];
    $r['upcoming_bookings'] = (int)$r['upcoming_bookings'];
}

json_response(['rooms' => $rooms]);
