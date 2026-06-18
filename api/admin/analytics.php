<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

$pdo = get_db();

// ---- range params --------------------------------------------------------
// Both optional. Empty = unbounded that side. Format: YYYY-MM-DD.
$from = $_GET['from'] ?? '';
$to   = $_GET['to']   ?? '';

$valid_date = function ($s) {
    if ($s === '') return null;
    $d = DateTime::createFromFormat('Y-m-d', $s);
    return ($d && $d->format('Y-m-d') === $s) ? $s : null;
};
$from = $valid_date($from);
$to   = $valid_date($to);

// Build a reusable WHERE-fragment + bind list. Bookings are dated by booked_at;
// cancelled bookings are excluded from revenue everywhere.
$where_parts = ["status != 'cancelled'"];
$bind        = [];
if ($from) { $where_parts[] = 'booked_at >= ?'; $bind[] = $from . ' 00:00:00'; }
if ($to)   { $where_parts[] = 'booked_at <= ?'; $bind[] = $to   . ' 23:59:59'; }
$WHERE = implode(' AND ', $where_parts);

// Helper to run a prepared SELECT with the range bindings
$q = function ($sql) use ($pdo, $bind) {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($bind);
    return $stmt;
};

// ---- Range totals (HOTELS + ACTIVITIES combined) -------------------------
// We treat the platform's revenue as the sum across both verticals.
// Admin's share is computed using each property/operator's commission rate.

$hotel_totals = $q("SELECT
        COUNT(*) AS bookings,
        COALESCE(SUM(b.total_amount), 0) AS revenue,
        COALESCE(SUM(b.total_amount * h.commission_percent / 100), 0) AS admin_share
     FROM hotel_bookings b
     JOIN hotels h ON h.id = b.hotel_id
     WHERE $WHERE")->fetch();

$act_totals = $q("SELECT
        COUNT(*) AS bookings,
        COALESCE(SUM(b.total_amount), 0) AS revenue,
        COALESCE(SUM(b.total_amount * COALESCE(o.commission_percent, 0) / 100), 0) AS admin_share
     FROM activity_bookings b
     JOIN water_activities a       ON a.id = b.activity_id
     LEFT JOIN activity_operators o ON o.id = a.operator_id
     WHERE $WHERE")->fetch();

$bookings = (int)$hotel_totals['bookings'] + (int)$act_totals['bookings'];
$revenue  = (float)$hotel_totals['revenue']  + (float)$act_totals['revenue'];
$share    = (float)$hotel_totals['admin_share'] + (float)$act_totals['admin_share'];
$payout   = $revenue - $share;
$avg      = $bookings > 0 ? $revenue / $bookings : 0;

// ---- Source split (hotel only — has booking_source) ----------------------
$by_source = $q("SELECT booking_source, COUNT(*) AS bookings,
                        COALESCE(SUM(total_amount), 0) AS revenue
                 FROM hotel_bookings
                 WHERE $WHERE
                 GROUP BY booking_source")->fetchAll();

// ---- Top hotels by revenue in range --------------------------------------
$bind_h = $bind; // copy
$top_hotels_sql = "SELECT h.id, h.name, h.city, h.image_url,
                          COUNT(b.id) AS bookings,
                          COALESCE(SUM(b.total_amount), 0) AS revenue,
                          COALESCE(SUM(b.total_amount * h.commission_percent / 100), 0) AS admin_share
                   FROM hotels h
                   LEFT JOIN hotel_bookings b ON b.hotel_id = h.id AND " . str_replace('booked_at', 'b.booked_at', $WHERE) . "
                   GROUP BY h.id, h.name, h.city, h.image_url
                   ORDER BY revenue DESC LIMIT 5";
$th = $pdo->prepare($top_hotels_sql);
$th->execute($bind_h);
$top_hotels = $th->fetchAll();

// ---- Top activities by revenue in range ----------------------------------
$top_acts_sql = "SELECT a.id, a.name, a.city, a.image_url,
                        o.full_name AS operator_name,
                        COUNT(b.id) AS bookings,
                        COALESCE(SUM(b.total_amount), 0) AS revenue,
                        COALESCE(SUM(b.total_amount * COALESCE(o.commission_percent, 0) / 100), 0) AS admin_share
                 FROM water_activities a
                 LEFT JOIN activity_bookings b      ON b.activity_id = a.id AND " . str_replace('booked_at', 'b.booked_at', $WHERE) . "
                 LEFT JOIN activity_operators o     ON o.id = a.operator_id
                 GROUP BY a.id, a.name, a.city, a.image_url, o.full_name
                 ORDER BY revenue DESC LIMIT 5";
$ta = $pdo->prepare($top_acts_sql);
$ta->execute($bind);
$top_activities = $ta->fetchAll();

// ---- Trend bucketed by month within the range ----------------------------
$trend_h = $q("SELECT DATE_FORMAT(booked_at, '%Y-%m') AS month,
                      COUNT(*) AS bookings,
                      COALESCE(SUM(total_amount), 0) AS revenue
               FROM hotel_bookings
               WHERE $WHERE
               GROUP BY month
               ORDER BY month ASC")->fetchAll();

$trend_a = $q("SELECT DATE_FORMAT(booked_at, '%Y-%m') AS month,
                      COUNT(*) AS bookings,
                      COALESCE(SUM(total_amount), 0) AS revenue
               FROM activity_bookings
               WHERE $WHERE
               GROUP BY month
               ORDER BY month ASC")->fetchAll();

// Merge the two trends by month
$trend_map = [];
foreach ($trend_h as $r) {
    $m = $r['month'];
    $trend_map[$m] = ['month' => $m, 'bookings' => (int)$r['bookings'], 'revenue' => (float)$r['revenue']];
}
foreach ($trend_a as $r) {
    $m = $r['month'];
    if (!isset($trend_map[$m])) {
        $trend_map[$m] = ['month' => $m, 'bookings' => 0, 'revenue' => 0.0];
    }
    $trend_map[$m]['bookings'] += (int)$r['bookings'];
    $trend_map[$m]['revenue']  += (float)$r['revenue'];
}
ksort($trend_map);
$trend = array_values($trend_map);

// ---- Status breakdown (hotel + activity combined) ------------------------
$status_h = $pdo->prepare("SELECT status, COUNT(*) AS count FROM hotel_bookings"
    . ($from || $to ? " WHERE 1=1"
        . ($from ? " AND booked_at >= ?" : "")
        . ($to   ? " AND booked_at <= ?" : "")
        : "")
    . " GROUP BY status");
$sbind = [];
if ($from) $sbind[] = $from . ' 00:00:00';
if ($to)   $sbind[] = $to   . ' 23:59:59';
$status_h->execute($sbind);
$sh = $status_h->fetchAll();

$status_a = $pdo->prepare("SELECT status, COUNT(*) AS count FROM activity_bookings"
    . ($from || $to ? " WHERE 1=1"
        . ($from ? " AND booked_at >= ?" : "")
        . ($to   ? " AND booked_at <= ?" : "")
        : "")
    . " GROUP BY status");
$status_a->execute($sbind);
$sa = $status_a->fetchAll();

$status_map = [];
foreach (array_merge($sh, $sa) as $r) {
    $status_map[$r['status']] = ($status_map[$r['status']] ?? 0) + (int)$r['count'];
}
$by_status = [];
foreach ($status_map as $k => $v) $by_status[] = ['status' => $k, 'count' => $v];

// ---- Casts ---------------------------------------------------------------
foreach ($by_source as &$r) { $r['bookings'] = (int)$r['bookings']; $r['revenue'] = (float)$r['revenue']; }
foreach ($top_hotels as &$r) {
    $r['id']          = (int)$r['id'];
    $r['bookings']    = (int)$r['bookings'];
    $r['revenue']     = (float)$r['revenue'];
    $r['admin_share'] = (float)$r['admin_share'];
}
foreach ($top_activities as &$r) {
    $r['id']          = (int)$r['id'];
    $r['bookings']    = (int)$r['bookings'];
    $r['revenue']     = (float)$r['revenue'];
    $r['admin_share'] = (float)$r['admin_share'];
}

json_response([
    'range' => [ 'from' => $from, 'to' => $to ],
    'totals' => [
        'bookings'    => $bookings,
        'revenue'     => round($revenue, 2),
        'admin_share' => round($share,   2),
        'payout'      => round($payout,  2),
        'avg_ticket'  => round($avg,     2),
    ],
    'by_source'      => $by_source,
    'by_status'      => $by_status,
    'top_hotels'     => $top_hotels,
    'top_activities' => $top_activities,
    'monthly_trend'  => $trend,
]);
