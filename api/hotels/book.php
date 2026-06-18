<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/email.php';
require_once __DIR__ . '/_availability.php';

cors_headers();
require_method('POST');

$payload = require_user_auth();
$user_id = (int)$payload['sub'];

$body = read_json_body();
$room_id   = (int)($body['room_id']   ?? 0);
$checkin   = trim($body['check_in']   ?? '');
$checkout  = trim($body['check_out']  ?? '');
$guests    = max(1, (int)($body['guests'] ?? 1));

if ($room_id <= 0 || $checkin === '' || $checkout === '') {
    json_error('Room, check-in and check-out are required', 400);
}

try {
    $in  = new DateTime($checkin);
    $out = new DateTime($checkout);
} catch (Exception $e) {
    json_error('Invalid dates', 400);
}
$nights = (int)$in->diff($out)->format('%a');
if ($out <= $in) json_error('Check-out must be after check-in', 400);

$pdo = get_db();

$stmt = $pdo->prepare('SELECT r.*, h.name AS hotel_name, h.address AS hotel_address
                       FROM hotel_rooms r
                       JOIN hotels h ON h.id = r.hotel_id
                       WHERE r.id = ? AND r.is_active = 1 LIMIT 1');
$stmt->execute([$room_id]);
$room = $stmt->fetch();
if (!$room) json_error('Room not found', 404);

if ($guests > (int)$room['capacity']) {
    json_error('Room only accommodates ' . $room['capacity'] . ' guest(s)', 400);
}

// Availability check (prevent overbooking)
$avail = room_availability($room_id, $checkin, $checkout);
if ($avail['fully_booked']) {
    json_error('Sorry, this room is sold out for the selected dates', 409);
}

$total = (float)$room['price_per_night'] * $nights;
$code  = 'HB' . strtoupper(bin2hex(random_bytes(4)));

$insert = $pdo->prepare('INSERT INTO hotel_bookings
    (booking_code, user_id, hotel_id, room_id, check_in, check_out, nights, guests, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$insert->execute([
    $code, $user_id, (int)$room['hotel_id'], $room_id,
    $checkin, $checkout, $nights, $guests, $total, 'confirmed',
]);
$bookingId = (int)$pdo->lastInsertId();

// Send confirmation email. Don't block the response if it fails — the booking
// is the source of truth and lives in My Bookings either way.
$email_status = ['sent' => false, 'error' => 'not_attempted'];
$u = $pdo->prepare('SELECT name, email FROM users WHERE id = ? LIMIT 1');
$u->execute([$user_id]);
$guest = $u->fetch();
if ($guest && $guest['email']) {
    $email_status = send_booking_confirmation_email($guest['email'], $guest['name'], [
        'booking_code' => $code,
        'hotel_name'   => $room['hotel_name'],
        'address'      => $room['hotel_address'],
        'room_type'    => $room['room_type'],
        'check_in'     => $checkin,
        'check_out'    => $checkout,
        'nights'       => $nights,
        'guests'       => $guests,
        'total_amount' => $total,
        'status'       => 'confirmed',
    ]);
    if (!$email_status['sent']) {
        error_log("[BOOKING-EMAIL] failed for booking $code -> {$guest['email']}: " . ($email_status['error'] ?? 'unknown'));
    }
}

json_response([
    'booking' => [
        'id'            => $bookingId,
        'booking_code'  => $code,
        'hotel'         => $room['hotel_name'],
        'room_type'     => $room['room_type'],
        'check_in'      => $checkin,
        'check_out'     => $checkout,
        'nights'        => $nights,
        'guests'        => $guests,
        'total_amount'  => $total,
        'status'        => 'confirmed',
    ],
    'email_sent' => $email_status['sent'],
], 201);
