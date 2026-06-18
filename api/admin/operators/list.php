<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

$pdo = get_db();
$rows = $pdo->query('SELECT o.id, o.username, o.email, o.full_name, o.phone, o.commission_percent,
                            o.is_active, o.last_login, o.created_at,
                            (SELECT COUNT(*) FROM water_activities a WHERE a.operator_id = o.id) AS activity_count,
                            (SELECT COUNT(*) FROM activity_bookings b
                               JOIN water_activities a ON a.id = b.activity_id
                              WHERE a.operator_id = o.id) AS booking_count
                     FROM activity_operators o
                     ORDER BY o.created_at DESC')->fetchAll();

foreach ($rows as &$o) {
    $o['id']                 = (int)$o['id'];
    $o['commission_percent'] = (float)($o['commission_percent'] ?? 0);
    $o['is_active']          = (bool)$o['is_active'];
    $o['activity_count']     = (int)$o['activity_count'];
    $o['booking_count']      = (int)$o['booking_count'];
}

json_response(['operators' => $rows]);
