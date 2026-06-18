<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$body = read_json_body();
$id     = (int)($body['id'] ?? 0);
$status = trim($body['status'] ?? '');
$allowed = ['pending','confirmed','cancelled','completed'];

if (!$id || !in_array($status, $allowed, true)) {
    json_error('Valid booking id and status are required', 400);
}

$pdo = get_db();

// Ownership check: booking -> activity -> operator
$own = $pdo->prepare('SELECT a.operator_id
                      FROM activity_bookings b
                      JOIN water_activities a ON a.id = b.activity_id
                      WHERE b.id = ?');
$own->execute([$id]);
$owner = $own->fetchColumn();
if ($owner === false) json_error('Booking not found', 404);
if ((int)$owner !== $op_id) json_error('Forbidden', 403);

$stmt = $pdo->prepare('UPDATE activity_bookings SET status = ? WHERE id = ?');
$stmt->execute([$status, $id]);

json_response(['id' => $id, 'status' => $status, 'updated' => $stmt->rowCount() > 0]);
