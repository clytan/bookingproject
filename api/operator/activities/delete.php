<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
if ($id <= 0) json_error('id required', 400);

$pdo = get_db();

// Ownership check
$own = $pdo->prepare('SELECT operator_id FROM water_activities WHERE id = ?');
$own->execute([$id]);
$owner = $own->fetchColumn();
if ($owner === false) json_error('Activity not found', 404);
if ((int)$owner !== $op_id) json_error('Forbidden', 403);

$active = $pdo->prepare('SELECT COUNT(*) FROM activity_bookings
                         WHERE activity_id = ? AND status IN (\'pending\',\'confirmed\')
                           AND activity_date >= CURDATE()');
$active->execute([$id]);
if ((int)$active->fetchColumn() > 0) {
    json_error('Cannot delete an activity with upcoming bookings. Disable it instead.', 409);
}

$stmt = $pdo->prepare('DELETE FROM water_activities WHERE id = ?');
$stmt->execute([$id]);
json_response(['id' => $id, 'deleted' => $stmt->rowCount() > 0]);
