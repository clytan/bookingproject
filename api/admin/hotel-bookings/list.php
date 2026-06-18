<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

// ---- range params (optional) -----------------------------------------------
$from = $_GET['from'] ?? '';
$to   = $_GET['to']   ?? '';

$valid = function ($s) {
    if ($s === '') return null;
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $s : null;
};
$from = $valid($from);
$to   = $valid($to);

$where = [];
$bind  = [];
if ($from) { $where[] = 'b.booked_at >= ?'; $bind[] = $from . ' 00:00:00'; }
if ($to)   { $where[] = 'b.booked_at <= ?'; $bind[] = $to   . ' 23:59:59'; }
$WHERE_SQL = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

$pdo = get_db();
$stmt = $pdo->prepare("SELECT b.id, b.booking_code, b.check_in, b.check_out, b.nights, b.guests,
                              b.total_amount, b.status, b.booked_at,
                              u.name AS user_name, u.email AS user_email,
                              h.name AS hotel_name, h.city, h.commission_percent,
                              r.room_type
                       FROM hotel_bookings b
                       JOIN users u        ON u.id = b.user_id
                       JOIN hotels h       ON h.id = b.hotel_id
                       JOIN hotel_rooms r  ON r.id = b.room_id
                       $WHERE_SQL
                       ORDER BY b.booked_at DESC");
$stmt->execute($bind);
$rows = $stmt->fetchAll();

$totals = ['gross' => 0.0, 'admin_share' => 0.0, 'payout' => 0.0];

foreach ($rows as &$b) {
    $b['id']           = (int)$b['id'];
    $b['nights']       = (int)$b['nights'];
    $b['guests']       = (int)$b['guests'];
    $b['total_amount'] = (float)$b['total_amount'];

    $pct  = (float)($b['commission_percent'] ?? 0);
    $share  = round($b['total_amount'] * $pct / 100, 2);
    $payout = round($b['total_amount'] - $share, 2);

    $b['commission_percent'] = $pct;
    $b['admin_share']        = $share;
    $b['payout_amount']      = $payout;

    if ($b['status'] === 'confirmed' || $b['status'] === 'completed') {
        $totals['gross']       += $b['total_amount'];
        $totals['admin_share'] += $share;
        $totals['payout']      += $payout;
    }
}

json_response([
    'range'    => ['from' => $from, 'to' => $to],
    'bookings' => $rows,
    'totals'   => $totals,
]);
