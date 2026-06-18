<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$pdo = get_db();

function one_op($pdo, $sql, $params) {
    $s = $pdo->prepare($sql);
    $s->execute($params);
    return $s->fetchColumn();
}

$today_bookings = (int)one_op($pdo,
  'SELECT COUNT(*) FROM activity_bookings b
     JOIN water_activities a ON a.id = b.activity_id
    WHERE a.operator_id = ? AND b.activity_date = CURDATE() AND b.status IN (\'confirmed\',\'pending\')', [$op_id]);

$today_persons = (int)one_op($pdo,
  'SELECT COALESCE(SUM(b.persons), 0) FROM activity_bookings b
     JOIN water_activities a ON a.id = b.activity_id
    WHERE a.operator_id = ? AND b.activity_date = CURDATE() AND b.status IN (\'confirmed\',\'pending\')', [$op_id]);

$upcoming_total = (int)one_op($pdo,
  'SELECT COUNT(*) FROM activity_bookings b
     JOIN water_activities a ON a.id = b.activity_id
    WHERE a.operator_id = ? AND b.activity_date >= CURDATE() AND b.status IN (\'confirmed\',\'pending\')', [$op_id]);

$month_revenue = (float)one_op($pdo,
  'SELECT COALESCE(SUM(b.total_amount), 0) FROM activity_bookings b
     JOIN water_activities a ON a.id = b.activity_id
    WHERE a.operator_id = ? AND b.status IN (\'confirmed\',\'completed\')
      AND MONTH(b.booked_at) = MONTH(CURDATE()) AND YEAR(b.booked_at) = YEAR(CURDATE())', [$op_id]);

$month_bookings = (int)one_op($pdo,
  'SELECT COUNT(*) FROM activity_bookings b
     JOIN water_activities a ON a.id = b.activity_id
    WHERE a.operator_id = ? AND b.status != \'cancelled\'
      AND MONTH(b.booked_at) = MONTH(CURDATE()) AND YEAR(b.booked_at) = YEAR(CURDATE())', [$op_id]);

$activity_count = (int)one_op($pdo,
  'SELECT COUNT(*) FROM water_activities WHERE operator_id = ?', [$op_id]);

$upcoming = $pdo->prepare(
  'SELECT b.id, b.booking_code, b.booking_source, b.activity_date, b.persons,
          b.total_amount, b.status,
          COALESCE(u.name, b.guest_name, \'Walk-in\') AS guest,
          a.name AS activity_name, a.city,
          s.slot_label, s.departure_time
   FROM activity_bookings b
   JOIN water_activities a ON a.id = b.activity_id
   JOIN activity_slots s    ON s.id = b.slot_id
   LEFT JOIN users u        ON u.id = b.user_id
   WHERE a.operator_id = ? AND b.status IN (\'pending\',\'confirmed\') AND b.activity_date >= CURDATE()
   ORDER BY b.activity_date ASC, s.departure_time ASC LIMIT 6');
$upcoming->execute([$op_id]);
$upcoming = $upcoming->fetchAll();

foreach ($upcoming as &$b) {
    $b['id']           = (int)$b['id'];
    $b['persons']      = (int)$b['persons'];
    $b['total_amount'] = (float)$b['total_amount'];
}

json_response([
    'stats' => [
        'today_bookings'  => $today_bookings,
        'today_persons'   => $today_persons,
        'upcoming_total'  => $upcoming_total,
        'month_revenue'   => $month_revenue,
        'month_bookings'  => $month_bookings,
        'activity_count'  => $activity_count,
    ],
    'upcoming' => $upcoming,
]);
