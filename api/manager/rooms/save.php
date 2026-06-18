<?php
// POST: create new room (when id absent) or update existing (when id present)
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$body = read_json_body();
$id              = (int)($body['id'] ?? 0);
$room_type       = trim($body['room_type'] ?? '');
$description     = trim($body['description'] ?? '');
$price_per_night = (float)($body['price_per_night'] ?? 0);
$capacity        = (int)($body['capacity'] ?? 0);
$total_rooms     = (int)($body['total_rooms'] ?? 0);
$image_url       = trim($body['image_url'] ?? '');
$amenities       = trim($body['amenities'] ?? '');
$is_active       = (int)!!($body['is_active'] ?? true);

if ($room_type === '' || $price_per_night <= 0 || $capacity < 1 || $total_rooms < 1) {
    json_error('Room type, price, capacity and total rooms are required', 400);
}

$pdo = get_db();

if ($id > 0) {
    // Update — verify ownership
    $own = $pdo->prepare('SELECT id FROM hotel_rooms WHERE id = ? AND hotel_id = ? LIMIT 1');
    $own->execute([$id, $hotel_id]);
    if (!$own->fetch()) json_error('Room not found', 404);

    $stmt = $pdo->prepare('UPDATE hotel_rooms
        SET room_type=?, description=?, price_per_night=?, capacity=?, total_rooms=?,
            image_url=?, amenities=?, is_active=?
        WHERE id=? AND hotel_id=?');
    $stmt->execute([
        $room_type, $description ?: null, $price_per_night, $capacity, $total_rooms,
        $image_url ?: null, $amenities ?: null, $is_active, $id, $hotel_id,
    ]);
    json_response(['id' => $id, 'updated' => true]);
} else {
    // Create
    $stmt = $pdo->prepare('INSERT INTO hotel_rooms
        (hotel_id, room_type, description, price_per_night, capacity, total_rooms, image_url, amenities, is_active)
        VALUES (?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $hotel_id, $room_type, $description ?: null, $price_per_night, $capacity, $total_rooms,
        $image_url ?: null, $amenities ?: null, $is_active,
    ]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
