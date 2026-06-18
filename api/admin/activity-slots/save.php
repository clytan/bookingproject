<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$body = read_json_body();
$id               = (int)($body['id'] ?? 0);
$activity_id      = (int)($body['activity_id'] ?? 0);
$slot_label       = trim($body['slot_label']  ?? '');
$description      = trim($body['description'] ?? '');
$departure_time   = trim($body['departure_time'] ?? '');
$duration_min     = max(1, (int)($body['duration_min'] ?? 60));
$price_per_person = (float)($body['price_per_person'] ?? 0);
$max_persons      = max(1, (int)($body['max_persons'] ?? 1));
$image_url        = trim($body['image_url'] ?? '');
$includes         = trim($body['includes']  ?? '');
$is_active        = (int)!!($body['is_active'] ?? true);

if (!$activity_id || $slot_label === '' || $departure_time === '' || $price_per_person <= 0) {
    json_error('activity_id, slot label, departure time and price are required', 400);
}

$pdo = get_db();

if ($id > 0) {
    $stmt = $pdo->prepare('UPDATE activity_slots SET activity_id=?, slot_label=?, description=?,
        departure_time=?, duration_min=?, price_per_person=?, max_persons=?, image_url=?, includes=?, is_active=?
        WHERE id=?');
    $stmt->execute([$activity_id, $slot_label, $description ?: null, $departure_time, $duration_min,
        $price_per_person, $max_persons, $image_url ?: null, $includes ?: null, $is_active, $id]);
    json_response(['id' => $id, 'updated' => true]);
} else {
    $stmt = $pdo->prepare('INSERT INTO activity_slots
        (activity_id, slot_label, description, departure_time, duration_min, price_per_person, max_persons, image_url, includes, is_active)
        VALUES (?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$activity_id, $slot_label, $description ?: null, $departure_time, $duration_min,
        $price_per_person, $max_persons, $image_url ?: null, $includes ?: null, $is_active]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
