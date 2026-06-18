<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$from = $_GET['from'] ?? '';
$to   = $_GET['to']   ?? '';
$valid = function ($s) {
    if ($s === '') return null;
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $s : null;
};
$from = $valid($from);
$to   = $valid($to);

$pdo = get_db();

$h = $pdo->prepare('SELECT commission_percent FROM hotels WHERE id = ?');
$h->execute([$hotel_id]);
$pct = (float)($h->fetchColumn() ?: 0);

// Build the booked_at range clause + bind list shared across queries
$wparts = ["hotel_id = ?", "status != 'cancelled'"];
$wbind  = [$hotel_id];
if ($from) { $wparts[] = 'booked_at >= ?'; $wbind[] = $from . ' 00:00:00'; }
if ($to)   { $wparts[] = 'booked_at <= ?'; $wbind[] = $to   . ' 23:59:59'; }
$W = implode(' AND ', $wparts);

$q = function ($sql) use ($pdo, $wbind) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($wbind);
    return $stmt;
};

$totals_row = $q("SELECT COUNT(*) AS bookings, COALESCE(SUM(total_amount), 0) AS revenue
                  FROM hotel_bookings WHERE $W")->fetch();
$revenue = (float)$totals_row['revenue'];
$share   = round($revenue * $pct / 100, 2);
$payout  = round($revenue - $share, 2);

// Per-room performance scoped to range
$by_room_sql = "SELECT r.id, r.room_type, r.total_rooms, r.price_per_night,
                       (SELECT COUNT(*)  FROM hotel_bookings b
                          WHERE b.room_id = r.id AND b.status != 'cancelled'"
                . ($from ? " AND b.booked_at >= ?" : "")
                . ($to   ? " AND b.booked_at <= ?" : "") . ") AS bookings,
                       (SELECT COALESCE(SUM(b.total_amount), 0) FROM hotel_bookings b
                          WHERE b.room_id = r.id AND b.status != 'cancelled'"
                . ($from ? " AND b.booked_at >= ?" : "")
                . ($to   ? " AND b.booked_at <= ?" : "") . ") AS revenue
                FROM hotel_rooms r
                WHERE r.hotel_id = ?
                ORDER BY revenue DESC";
$brbind = [];
if ($from) $brbind[] = $from . ' 00:00:00';
if ($to)   $brbind[] = $to   . ' 23:59:59';
if ($from) $brbind[] = $from . ' 00:00:00';
if ($to)   $brbind[] = $to   . ' 23:59:59';
$brbind[] = $hotel_id;
$br = $pdo->prepare($by_room_sql);
$br->execute($brbind);
$by_room = $br->fetchAll();

$by_source = $q("SELECT booking_source, COUNT(*) AS bookings,
                        COALESCE(SUM(total_amount), 0) AS revenue
                 FROM hotel_bookings WHERE $W
                 GROUP BY booking_source")->fetchAll();

$trend = $q("SELECT DATE_FORMAT(booked_at, '%Y-%m') AS month,
                    COUNT(*) AS bookings,
                    COALESCE(SUM(total_amount), 0) AS revenue
             FROM hotel_bookings WHERE $W
             GROUP BY month ORDER BY month ASC")->fetchAll();

foreach ($by_room as &$r) {
    $r['id']              = (int)$r['id'];
    $r['total_rooms']     = (int)$r['total_rooms'];
    $r['price_per_night'] = (float)$r['price_per_night'];
    $r['bookings']        = (int)$r['bookings'];
    $r['revenue']         = (float)$r['revenue'];
    $r['admin_share']     = round($r['revenue'] * $pct / 100, 2);
    $r['payout']          = round($r['revenue'] - $r['admin_share'], 2);
}
foreach ($by_source as &$r) { $r['bookings'] = (int)$r['bookings']; $r['revenue'] = (float)$r['revenue']; }
foreach ($trend     as &$r) { $r['bookings'] = (int)$r['bookings']; $r['revenue'] = (float)$r['revenue']; }

json_response([
    'range'              => ['from' => $from, 'to' => $to],
    'commission_percent' => $pct,
    'totals' => [
        'bookings'    => (int)$totals_row['bookings'],
        'revenue'     => round($revenue, 2),
        'admin_share' => $share,
        'payout'      => $payout,
    ],
    'by_room'   => $by_room,
    'by_source' => $by_source,
    'trend'     => $trend,
]);
