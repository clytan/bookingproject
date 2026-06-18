<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$pdo = get_db();
$stmt = $pdo->prepare('SELECT a.*,
                              (SELECT COUNT(*) FROM activity_slots s WHERE s.activity_id = a.id) AS slot_count,
                              (SELECT COUNT(*) FROM activity_bookings b
                                 WHERE b.activity_id = a.id AND b.status IN (\'pending\',\'confirmed\')
                                   AND b.activity_date >= CURDATE()) AS upcoming_bookings
                       FROM water_activities a
                       WHERE a.operator_id = ?
                       ORDER BY a.created_at DESC');
$stmt->execute([$op_id]);
$rows = $stmt->fetchAll();

foreach ($rows as &$a) {
    $a['id']                = (int)$a['id'];
    $a['operator_id']       = (int)$a['operator_id'];
    $a['duration_min']      = (int)$a['duration_min'];
    $a['user_rating']       = (float)$a['user_rating'];
    $a['is_active']         = (bool)$a['is_active'];
    $a['slot_count']        = (int)$a['slot_count'];
    $a['upcoming_bookings'] = (int)$a['upcoming_bookings'];
}

json_response(['activities' => $rows]);
