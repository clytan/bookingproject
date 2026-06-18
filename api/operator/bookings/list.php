<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$status      = trim($_GET['status']      ?? '');
$activity_id = (int)($_GET['activity_id'] ?? 0);
$from        = trim($_GET['from']         ?? '');
$to          = trim($_GET['to']           ?? '');

$valid = function ($s) {
    if ($s === '') return null;
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $s : null;
};
$from = $valid($from);
$to   = $valid($to);

$pdo = get_db();

$o = $pdo->prepare('SELECT commission_percent FROM activity_operators WHERE id = ?');
$o->execute([$op_id]);
$commission_pct = (float)($o->fetchColumn() ?: 0);

$sql  = 'SELECT b.id, b.booking_code, b.activity_date, b.persons,
                b.total_amount, b.status, b.booking_source, b.booked_at, b.notes,
                COALESCE(u.name,  b.guest_name)  AS guest_label,
                COALESCE(u.email, b.guest_email) AS contact,
                a.id AS activity_id, a.name AS activity_name, a.city,
                s.slot_label, s.departure_time
         FROM activity_bookings b
         JOIN water_activities a  ON a.id = b.activity_id
         JOIN activity_slots s    ON s.id = b.slot_id
         LEFT JOIN users u        ON u.id = b.user_id
         WHERE a.operator_id = ?';
$params = [$op_id];
if ($status !== '')   { $sql .= ' AND b.status = ?';        $params[] = $status; }
if ($activity_id > 0) { $sql .= ' AND a.id = ?';            $params[] = $activity_id; }
if ($from)            { $sql .= ' AND b.booked_at >= ?';    $params[] = $from . ' 00:00:00'; }
if ($to)              { $sql .= ' AND b.booked_at <= ?';    $params[] = $to   . ' 23:59:59'; }
$sql .= ' ORDER BY b.activity_date DESC, b.booked_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$totals = ['gross' => 0.0, 'admin_share' => 0.0, 'payout' => 0.0];

foreach ($rows as &$b) {
    $b['id']           = (int)$b['id'];
    $b['activity_id']  = (int)$b['activity_id'];
    $b['persons']      = (int)$b['persons'];
    $b['total_amount'] = (float)$b['total_amount'];

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
