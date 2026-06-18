<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

$pdo = get_db();
$rows = $pdo->query('SELECT a.*, o.full_name AS operator_name, o.username AS operator_username,
                            (SELECT COUNT(*) FROM activity_slots s WHERE s.activity_id = a.id) AS slot_count,
                            (SELECT COUNT(*) FROM activity_bookings b WHERE b.activity_id = a.id) AS booking_count
                     FROM water_activities a
                     LEFT JOIN activity_operators o ON o.id = a.operator_id
                     ORDER BY a.created_at DESC')->fetchAll();

foreach ($rows as &$a) {
    $a['id']            = (int)$a['id'];
    $a['operator_id']   = $a['operator_id'] !== null ? (int)$a['operator_id'] : null;
    $a['duration_min']  = (int)$a['duration_min'];
    $a['user_rating']   = (float)$a['user_rating'];
    $a['is_active']     = (bool)$a['is_active'];
    $a['slot_count']    = (int)$a['slot_count'];
    $a['booking_count'] = (int)$a['booking_count'];
}

json_response(['activities' => $rows]);
