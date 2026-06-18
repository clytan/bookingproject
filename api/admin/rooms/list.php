<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

$hotel_id = (int)($_GET['hotel_id'] ?? 0);

$pdo = get_db();

$sql = 'SELECT r.id, r.hotel_id, r.room_type, r.description, r.price_per_night,
               r.capacity, r.total_rooms, r.image_url, r.amenities, r.is_active,
               h.name AS hotel_name, h.city AS hotel_city,
               (SELECT COUNT(*) FROM hotel_bookings b
                 WHERE b.room_id = r.id AND b.status IN (\'pending\',\'confirmed\')) AS upcoming_bookings
        FROM hotel_rooms r
        JOIN hotels h ON h.id = r.hotel_id';
$params = [];
if ($hotel_id > 0) {
    $sql .= ' WHERE r.hotel_id = ?';
    $params[] = $hotel_id;
}
$sql .= ' ORDER BY h.name ASC, r.price_per_night ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
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
