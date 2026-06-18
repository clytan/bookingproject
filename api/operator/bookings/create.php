<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../config/email.php';

cors_headers();
require_method('POST');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$body = read_json_body();
$slot_id     = (int)($body['slot_id'] ?? 0);
$date        = trim($body['date']  ?? '');
$persons     = max(1, (int)($body['persons'] ?? 1));
$guest_name  = trim($body['guest_name']  ?? '');
$guest_email = trim($body['guest_email'] ?? '');
$guest_phone = trim($body['guest_phone'] ?? '');
$notes       = trim($body['notes']       ?? '');

if ($slot_id <= 0 || $date === '' || $guest_name === '') {
    json_error('Slot, date and guest name are required', 400);
}

$pdo = get_db();

// Verify slot belongs to one of this operator's activities
$slot = $pdo->prepare('SELECT s.*, a.id AS act_id, a.operator_id, a.name AS activity_name, a.city
                       FROM activity_slots s
                       JOIN water_activities a ON a.id = s.activity_id
                       WHERE s.id = ? AND s.is_active = 1 LIMIT 1');
$slot->execute([$slot_id]);
$slot = $slot->fetch();
if (!$slot) json_error('Slot not found', 404);
if ((int)$slot['operator_id'] !== $op_id) json_error('Forbidden: slot is not yours', 403);

// Availability check
$used = $pdo->prepare(
    'SELECT COALESCE(SUM(persons), 0) FROM activity_bookings
      WHERE slot_id = ? AND activity_date = ? AND status IN (\'pending\',\'confirmed\')'
);
$used->execute([$slot_id, $date]);
$booked    = (int)$used->fetchColumn();
$available = (int)$slot['max_persons'] - $booked;
if ($persons > $available) {
    json_error("Only $available place(s) left for that slot/date", 409);
}

$total = (float)$slot['price_per_person'] * $persons;
$code  = 'WA' . strtoupper(bin2hex(random_bytes(4)));

$insert = $pdo->prepare('INSERT INTO activity_bookings
    (booking_code, user_id, guest_name, guest_email, guest_phone, activity_id, slot_id,
     activity_date, persons, total_amount, status, booking_source, notes)
    VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$insert->execute([
    $code, $guest_name, $guest_email ?: null, $guest_phone ?: null,
    (int)$slot['act_id'], $slot_id, $date, $persons, $total, 'confirmed', 'operator', $notes ?: null,
]);
$id = (int)$pdo->lastInsertId();

$email_sent = false;
if ($guest_email) {
    $r = send_activity_confirmation_email($guest_email, $guest_name, [
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
    if (!$r['sent']) error_log("[ACTIVITY-EMAIL] walk-in $code failed: " . ($r['error'] ?? 'unknown'));
}

json_response([
    'booking' => [
        'id'             => $id,
        'booking_code'   => $code,
        'guest_name'     => $guest_name,
        'activity'       => $slot['activity_name'],
        'slot_label'     => $slot['slot_label'],
        'departure_time' => $slot['departure_time'],
        'date'           => $date,
        'persons'        => $persons,
        'total_amount'   => $total,
        'status'         => 'confirmed',
    ],
    'email_sent' => $email_sent,
], 201);
