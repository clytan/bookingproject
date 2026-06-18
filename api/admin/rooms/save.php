<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$body = read_json_body();
$id              = (int)($body['id'] ?? 0);
$hotel_id        = (int)($body['hotel_id'] ?? 0);
$room_type       = trim($body['room_type'] ?? '');
$description     = trim($body['description'] ?? '');
$price_per_night = (float)($body['price_per_night'] ?? 0);
$capacity        = (int)($body['capacity'] ?? 0);
$total_rooms     = (int)($body['total_rooms'] ?? 0);
$image_url       = trim($body['image_url'] ?? '');
$amenities       = trim($body['amenities'] ?? '');
$is_active       = (int)!!($body['is_active'] ?? true);

if (!$hotel_id || $room_type === '' || $price_per_night <= 0 || $capacity < 1 || $total_rooms < 1) {
    json_error('hotel_id, type, price, capacity and total rooms are required', 400);
}

$pdo = get_db();

if ($id > 0) {
    $stmt = $pdo->prepare('UPDATE hotel_rooms SET hotel_id=?, room_type=?, description=?,
        price_per_night=?, capacity=?, total_rooms=?, image_url=?, amenities=?, is_active=?
        WHERE id=?');
    $stmt->execute([$hotel_id, $room_type, $description ?: null, $price_per_night, $capacity,
        $total_rooms, $image_url ?: null, $amenities ?: null, $is_active, $id]);
    json_response(['id' => $id, 'updated' => true]);
} else {
    $stmt = $pdo->prepare('INSERT INTO hotel_rooms
        (hotel_id, room_type, description, price_per_night, capacity, total_rooms, image_url, amenities, is_active)
        VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$hotel_id, $room_type, $description ?: null, $price_per_night, $capacity,
        $total_rooms, $image_url ?: null, $amenities ?: null, $is_active]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
