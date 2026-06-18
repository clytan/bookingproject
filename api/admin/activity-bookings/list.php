<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

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
$stmt = $pdo->prepare("SELECT b.id, b.booking_code, b.activity_date, b.persons,
                              b.total_amount, b.status, b.booking_source, b.booked_at,
                              COALESCE(u.name, b.guest_name)   AS user_name,
                              COALESCE(u.email, b.guest_email) AS user_email,
                              a.name AS activity_name, a.city, a.category,
                              s.slot_label, s.departure_time,
                              o.full_name AS operator_name,
                              COALESCE(o.commission_percent, 0) AS commission_percent
                       FROM activity_bookings b
                       LEFT JOIN users u                  ON u.id = b.user_id
                       JOIN water_activities a            ON a.id = b.activity_id
                       JOIN activity_slots s              ON s.id = b.slot_id
                       LEFT JOIN activity_operators o     ON o.id = a.operator_id
                       $WHERE_SQL
                       ORDER BY b.booked_at DESC");
$stmt->execute($bind);
$rows = $stmt->fetchAll();

$totals = ['gross' => 0.0, 'admin_share' => 0.0, 'payout' => 0.0];

foreach ($rows as &$b) {
    $b['id']           = (int)$b['id'];
    $b['persons']      = (int)$b['persons'];
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
