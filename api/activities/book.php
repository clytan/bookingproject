<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/email.php';

cors_headers();
require_method('POST');

$payload = require_user_auth();
$user_id = (int)$payload['sub'];

$body = read_json_body();
$slot_id = (int)($body['slot_id']  ?? 0);
$date    = trim($body['date']      ?? '');
$persons = max(1, (int)($body['persons'] ?? 1));

if ($slot_id <= 0 || $date === '') {
    json_error('Slot and date are required', 400);
}

try {
    $when = new DateTime($date);
} catch (Exception $e) {
    json_error('Invalid date', 400);
}
$today = new DateTime('today');
if ($when < $today) json_error('Activity date cannot be in the past', 400);

$pdo = get_db();

$stmt = $pdo->prepare('SELECT s.*, a.name AS activity_name, a.city
                       FROM activity_slots s
                       JOIN water_activities a ON a.id = s.activity_id
                       WHERE s.id = ? AND s.is_active = 1 LIMIT 1');
$stmt->execute([$slot_id]);
$slot = $stmt->fetch();
if (!$slot) json_error('Slot not found', 404);

// Availability check
$used = $pdo->prepare(
    'SELECT COALESCE(SUM(persons), 0) FROM activity_bookings
      WHERE slot_id = ? AND activity_date = ? AND status IN (\'pending\',\'confirmed\')'
);
$used->execute([$slot_id, $date]);
$alreadyBooked = (int)$used->fetchColumn();
$available     = (int)$slot['max_persons'] - $alreadyBooked;

if ($persons > $available) {
    json_error("Only $available place(s) left for this slot on $date", 409);
}

$total = (float)$slot['price_per_person'] * $persons;
$code  = 'WA' . strtoupper(bin2hex(random_bytes(4)));

$insert = $pdo->prepare('INSERT INTO activity_bookings
    (booking_code, user_id, activity_id, slot_id, activity_date, persons, total_amount, status, booking_source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$insert->execute([
    $code, $user_id, (int)$slot['activity_id'], $slot_id,
    $date, $persons, $total, 'confirmed', 'user',
]);
$bookingId = (int)$pdo->lastInsertId();

$email_sent = false;
$u = $pdo->prepare('SELECT name, email FROM users WHERE id = ? LIMIT 1');
$u->execute([$user_id]);
$guest = $u->fetch();
if ($guest && $guest['email']) {
    $r = send_activity_confirmation_email($guest['email'], $guest['name'], [
        'booking_code'   => $code,
        'activity_name'  => $slot['activity_name'],
        'city'           => $slot['city'],
        'slot_label'     => $slot['slot_label'],
        'activity_date'  => $date,
        'departure_time' => $slot['departure_time'],
        'persons'        => $persons,
        'total_amount'   => $total,
    ]);
    $email_sent = $r['sent'];
    if (!$r['sent']) error_log("[ACTIVITY-EMAIL] user $code failed: " . ($r['error'] ?? 'unknown'));
}

json_response([
    'booking' => [
        'id'            => $bookingId,
        'booking_code'  => $code,
        'activity'      => $slot['activity_name'],
        'city'          => $slot['city'],
        'slot_label'    => $slot['slot_label'],
        'departure_time'=> $slot['departure_time'],
        'date'          => $date,
        'persons'       => $persons,
        'total_amount'  => $total,
        'status'        => 'confirmed',
    ],
    'email_sent' => $email_sent,
], 201);
