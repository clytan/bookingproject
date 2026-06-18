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

// Ownership check: slot -> activity -> operator
$own = $pdo->prepare('SELECT a.operator_id
                      FROM activity_slots s
                      JOIN water_activities a ON a.id = s.activity_id
                      WHERE s.id = ?');
$own->execute([$id]);
$owner = $own->fetchColumn();
if ($owner === false) json_error('Slot not found', 404);
if ((int)$owner !== $op_id) json_error('Forbidden', 403);

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
