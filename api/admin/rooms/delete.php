<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
if (!$id) json_error('id required', 400);

$pdo = get_db();
$active = $pdo->prepare('SELECT COUNT(*) FROM hotel_bookings
                         WHERE room_id = ? AND status IN (\'pending\',\'confirmed\')
                           AND check_out > CURDATE()');
$active->execute([$id]);
if ((int)$active->fetchColumn() > 0) {
    json_error('Cannot delete a room with upcoming bookings. Disable it instead.', 409);
}

$stmt = $pdo->prepare('DELETE FROM hotel_rooms WHERE id = ?');
$stmt->execute([$id]);
json_response(['id' => $id, 'deleted' => $stmt->rowCount() > 0]);
