<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$activity_id = (int)($_GET['activity_id'] ?? 0);

$pdo = get_db();
$sql = 'SELECT s.*, a.name AS activity_name, a.city AS activity_city,
               (SELECT COUNT(*) FROM activity_bookings b
                 WHERE b.slot_id = s.id AND b.status IN (\'pending\',\'confirmed\')
                   AND b.activity_date >= CURDATE()) AS upcoming_bookings
        FROM activity_slots s
        JOIN water_activities a ON a.id = s.activity_id
        WHERE a.operator_id = ?';
$params = [$op_id];
if ($activity_id > 0) {
    $sql .= ' AND s.activity_id = ?';
    $params[] = $activity_id;
}
$sql .= ' ORDER BY a.name ASC, s.departure_time ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$slots = $stmt->fetchAll();

foreach ($slots as &$s) {
    $s['id']                = (int)$s['id'];
    $s['activity_id']       = (int)$s['activity_id'];
    $s['duration_min']      = (int)$s['duration_min'];
    $s['price_per_person']  = (float)$s['price_per_person'];
    $s['max_persons']       = (int)$s['max_persons'];
    $s['is_active']         = (bool)$s['is_active'];
    $s['upcoming_bookings'] = (int)$s['upcoming_bookings'];
}

json_response(['slots' => $slots]);
