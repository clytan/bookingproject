<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('POST');

$payload = require_user_auth();
$user_id = (int)$payload['sub'];

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
if (!$id) json_error('id required', 400);

$pdo = get_db();
$stmt = $pdo->prepare('UPDATE hotel_bookings SET status = \'cancelled\'
                       WHERE id = ? AND user_id = ?
                       AND status IN (\'pending\',\'confirmed\')
                       AND check_in > CURDATE()');
$stmt->execute([$id, $user_id]);
if ($stmt->rowCount() === 0) {
    json_error('Cannot cancel — booking not found or already started', 409);
}
json_response(['id' => $id, 'cancelled' => true]);
