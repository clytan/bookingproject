<?php
// Manager creates a manual (walk-in / phone-in) booking.
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../config/email.php';
require_once __DIR__ . '/../../hotels/_availability.php';

cors_headers();
require_method('POST');
$payload    = require_manager_auth();
$manager_id = (int)$payload['sub'];
$hotel_id   = (int)$payload['hotel_id'];

$body = read_json_body();
$room_id     = (int)($body['room_id'] ?? 0);
$check_in    = trim($body['check_in']  ?? '');
$check_out   = trim($body['check_out'] ?? '');
$guests      = max(1, (int)($body['guests'] ?? 1));
$guest_name  = trim($body['guest_name']  ?? '');
$guest_email = trim($body['guest_email'] ?? '');
$guest_phone = trim($body['guest_phone'] ?? '');
$notes       = trim($body['notes']       ?? '');
$status      = trim($body['status']      ?? 'confirmed');

if (!$room_id || !$check_in || !$check_out || $guest_name === '') {
    json_error('Room, dates and guest name are required', 400);
}
if (!in_array($status, ['pending', 'confirmed'], true)) $status = 'confirmed';

try {
    $din  = new DateTime($check_in);
    $dout = new DateTime($check_out);
} catch (Exception $e) {
    json_error('Invalid dates', 400);
}
if ($dout <= $din) json_error('check-out must be after check-in', 400);
$nights = (int)$din->diff($dout)->format('%a');

$pdo = get_db();

// Verify room belongs to manager's hotel
$stmt = $pdo->prepare('SELECT r.*, h.id AS h_id, h.name AS hotel_name, h.address AS hotel_address
                       FROM hotel_rooms r
                       JOIN hotels h ON h.id = r.hotel_id
                       WHERE r.id = ? AND r.hotel_id = ? LIMIT 1');
$stmt->execute([$room_id, $hotel_id]);
$room = $stmt->fetch();
if (!$room) json_error('Room not found in your hotel', 404);

if ($guests > (int)$room['capacity']) {
    json_error('Room only accommodates ' . $room['capacity'] . ' guest(s)', 400);
}

// Availability check
$avail = room_availability($room_id, $check_in, $check_out);
if ($avail['fully_booked']) {
    json_error('No units of this room type are available for the selected dates', 409);
}

$total = (float)$room['price_per_night'] * $nights;
$code  = 'HM' . strtoupper(bin2hex(random_bytes(4)));

$insert = $pdo->prepare('INSERT INTO hotel_bookings
    (booking_code, user_id, booking_source, manager_id, guest_name, guest_email, guest_phone, notes,
     hotel_id, room_id, check_in, check_out, nights, guests, total_amount, status)
    VALUES (?, NULL, \'manager\', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$insert->execute([
    $code, $manager_id, $guest_name, $guest_email ?: null, $guest_phone ?: null, $notes ?: null,
    $hotel_id, $room_id, $check_in, $check_out, $nights, $guests, $total, $status,
]);
$bookingId = (int)$pdo->lastInsertId();

// Confirmation email (only when status=confirmed and a guest email exists)
$email_sent = false;
if ($status === 'confirmed' && $guest_email) {
    $r = send_booking_confirmation_email($guest_email, $guest_name, [
        'booking_code' => $code,
        'hotel_name'   => $room['hotel_name'],
        'address'      => $room['hotel_address'],
        'room_type'    => $room['room_type'],
        'check_in'     => $check_in,
        'check_out'    => $check_out,
        'nights'       => $nights,
        'guests'       => $guests,
        'total_amount' => $total,
        'status'       => $status,
    ]);
    $email_sent = $r['sent'];
    if (!$r['sent']) error_log("[BOOKING-EMAIL] walk-in $code failed: " . ($r['error'] ?? 'unknown'));
}

json_response([
    'booking' => [
        'id'           => $bookingId,
        'booking_code' => $code,
        'room_type'    => $room['room_type'],
        'check_in'     => $check_in,
        'check_out'    => $check_out,
        'nights'       => $nights,
        'guests'       => $guests,
        'guest_name'   => $guest_name,
        'total_amount' => $total,
        'status'       => $status,
    ],
    'email_sent' => $email_sent,
], 201);
