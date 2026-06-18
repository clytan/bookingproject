<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$status = trim($_GET['status'] ?? '');
$from   = trim($_GET['from']   ?? '');  // applied to booked_at (revenue date)
$to     = trim($_GET['to']     ?? '');

$valid = function ($s) {
    if ($s === '') return null;
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $s : null;
};
$from = $valid($from);
$to   = $valid($to);

$pdo = get_db();

// Hotel commission rate (constant for this manager's bookings)
$h = $pdo->prepare('SELECT commission_percent FROM hotels WHERE id = ?');
$h->execute([$hotel_id]);
$commission_pct = (float)($h->fetchColumn() ?: 0);

$sql = 'SELECT b.id, b.booking_code, b.booking_source, b.check_in, b.check_out, b.nights,
               b.guests, b.total_amount, b.status, b.booked_at, b.notes,
               b.guest_name, b.guest_email, b.guest_phone,
               u.name AS user_name, u.email AS user_email,
               r.room_type
        FROM hotel_bookings b
        JOIN hotel_rooms r ON r.id = b.room_id
        LEFT JOIN users  u ON u.id = b.user_id
        WHERE b.hotel_id = ?';
$params = [$hotel_id];

if ($status !== '') { $sql .= ' AND b.status = ?'; $params[] = $status; }
if ($from)          { $sql .= ' AND b.booked_at >= ?'; $params[] = $from . ' 00:00:00'; }
if ($to)            { $sql .= ' AND b.booked_at <= ?'; $params[] = $to   . ' 23:59:59'; }
$sql .= ' ORDER BY b.booked_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$totals = ['gross' => 0.0, 'admin_share' => 0.0, 'payout' => 0.0];

foreach ($rows as &$b) {
    $b['id']           = (int)$b['id'];
    $b['nights']       = (int)$b['nights'];
    $b['guests']       = (int)$b['guests'];
    $b['total_amount'] = (float)$b['total_amount'];
    $b['guest_label']  = $b['booking_source'] === 'user'
        ? ($b['user_name']  ?: 'Guest')
        : ($b['guest_name'] ?: 'Walk-in');
    $b['contact']      = $b['booking_source'] === 'user'
        ? $b['user_email']
        : ($b['guest_email'] ?: $b['guest_phone']);

    $share  = round($b['total_amount'] * $commission_pct / 100, 2);
    $payout = round($b['total_amount'] - $share, 2);

    $b['commission_percent'] = $commission_pct;
    $b['admin_share']        = $share;
    $b['payout_amount']      = $payout;

    if ($b['status'] === 'confirmed' || $b['status'] === 'completed') {
        $totals['gross']       += $b['total_amount'];
        $totals['admin_share'] += $share;
        $totals['payout']      += $payout;
    }
}

json_response([
    'range'              => ['from' => $from, 'to' => $to],
    'commission_percent' => $commission_pct,
    'bookings'           => $rows,
    'totals'             => $totals,
]);
