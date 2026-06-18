<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
if ($id <= 0) json_error('id required', 400);

$pdo = get_db();

$active = $pdo->prepare('SELECT COUNT(*) FROM activity_bookings
                         WHERE slot_id = ? AND status IN (\'pending\',\'confirmed\')
                           AND activity_date >= CURDATE()');
$active->execute([$id]);
if ((int)$active->fetchColumn() > 0) {
    json_error('Cannot delete a slot with upcoming bookings. Disable it instead.', 409);
}

$stmt = $pdo->prepare('DELETE FROM activity_slots WHERE id = ?');
$stmt->execute([$id]);
json_response(['id' => $id, 'deleted' => $stmt->rowCount() > 0]);
