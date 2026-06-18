<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_error('Hotel id is required', 400);

$pdo = get_db();

$stmt = $pdo->prepare('SELECT * FROM hotels WHERE id = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$id]);
$hotel = $stmt->fetch();

if (!$hotel) json_error('Hotel not found', 404);

$rooms = $pdo->prepare('SELECT * FROM hotel_rooms WHERE hotel_id = ? AND is_active = 1 ORDER BY price_per_night ASC');
$rooms->execute([$id]);
$rooms = $rooms->fetchAll();

$hotel['id']          = (int)$hotel['id'];
$hotel['star_rating'] = (int)$hotel['star_rating'];
$hotel['user_rating'] = (float)$hotel['user_rating'];

foreach ($rooms as &$r) {
    $r['id']              = (int)$r['id'];
    $r['hotel_id']        = (int)$r['hotel_id'];
    $r['price_per_night'] = (float)$r['price_per_night'];
    $r['capacity']        = (int)$r['capacity'];
    $r['total_rooms']     = (int)$r['total_rooms'];
}

json_response(['hotel' => $hotel, 'rooms' => $rooms]);
