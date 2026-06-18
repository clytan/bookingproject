<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/_availability.php';

cors_headers();
require_method('GET');

$hotel_id = (int)($_GET['hotel_id'] ?? 0);
$checkin  = trim($_GET['checkin']   ?? '');
$checkout = trim($_GET['checkout']  ?? '');

if (!$hotel_id || !$checkin || !$checkout) {
    json_error('hotel_id, checkin and checkout are required', 400);
}

try {
    $din  = new DateTime($checkin);
    $dout = new DateTime($checkout);
} catch (Exception $e) {
    json_error('Invalid dates', 400);
}
if ($dout <= $din) json_error('check-out must be after check-in', 400);

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id FROM hotel_rooms WHERE hotel_id = ? AND is_active = 1');
$stmt->execute([$hotel_id]);
$rooms = $stmt->fetchAll();

$result = [];
foreach ($rooms as $r) {
    $rid = (int)$r['id'];
    $result[$rid] = room_availability($rid, $checkin, $checkout);
}

json_response(['hotel_id' => $hotel_id, 'checkin' => $checkin, 'checkout' => $checkout, 'rooms' => $result]);
