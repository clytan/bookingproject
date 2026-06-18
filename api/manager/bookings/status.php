<?php
// Update a booking's status (e.g., mark cancelled, completed).
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$body = read_json_body();
$id     = (int)($body['id']     ?? 0);
$status = trim($body['status'] ?? '');

if (!$id || !in_array($status, ['pending','confirmed','cancelled','completed'], true)) {
    json_error('id and a valid status are required', 400);
}

$pdo = get_db();
$stmt = $pdo->prepare('UPDATE hotel_bookings SET status = ? WHERE id = ? AND hotel_id = ?');
$stmt->execute([$status, $id, $hotel_id]);
if ($stmt->rowCount() === 0) json_error('Booking not found', 404);

json_response(['id' => $id, 'status' => $status]);
