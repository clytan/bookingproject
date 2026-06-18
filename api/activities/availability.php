<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$activity_id = (int)($_GET['activity_id'] ?? 0);
$date        = trim($_GET['date'] ?? '');
if ($activity_id <= 0 || $date === '') json_error('activity_id and date required', 400);

$pdo = get_db();

$slots = $pdo->prepare('SELECT id, max_persons FROM activity_slots WHERE activity_id = ? AND is_active = 1');
$slots->execute([$activity_id]);
$slots = $slots->fetchAll();

$booked = $pdo->prepare(
    'SELECT slot_id, COALESCE(SUM(persons), 0) AS booked
       FROM activity_bookings
      WHERE activity_id = ? AND activity_date = ? AND status IN (\'pending\',\'confirmed\')
      GROUP BY slot_id'
);
$booked->execute([$activity_id, $date]);
$bookedMap = [];
foreach ($booked->fetchAll() as $b) $bookedMap[(int)$b['slot_id']] = (int)$b['booked'];

$result = [];
foreach ($slots as $s) {
    $sid    = (int)$s['id'];
    $cap    = (int)$s['max_persons'];
    $taken  = $bookedMap[$sid] ?? 0;
    $free   = max(0, $cap - $taken);
    $result[$sid] = [
        'max_persons' => $cap,
        'booked'      => $taken,
        'available'   => $free,
        'fully_booked'=> $free <= 0,
    ];
}

json_response(['date' => $date, 'slots' => $result]);
