<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

$activity_id = (int)($_GET['activity_id'] ?? 0);

$pdo = get_db();

$sql = 'SELECT s.id, s.activity_id, s.slot_label, s.description, s.departure_time,
               s.duration_min, s.price_per_person, s.max_persons, s.image_url, s.includes, s.is_active,
               a.name AS activity_name, a.city AS activity_city, a.category AS activity_category,
               (SELECT COUNT(*) FROM activity_bookings b
                 WHERE b.slot_id = s.id AND b.status IN (\'pending\',\'confirmed\')
                   AND b.activity_date >= CURDATE()) AS upcoming_bookings
        FROM activity_slots s
        JOIN water_activities a ON a.id = s.activity_id';
$params = [];
if ($activity_id > 0) {
    $sql .= ' WHERE s.activity_id = ?';
    $params[] = $activity_id;
}
$sql .= ' ORDER BY a.name ASC, s.departure_time ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

foreach ($rows as &$s) {
    $s['id']                = (int)$s['id'];
    $s['activity_id']       = (int)$s['activity_id'];
    $s['duration_min']      = (int)$s['duration_min'];
    $s['price_per_person']  = (float)$s['price_per_person'];
    $s['max_persons']       = (int)$s['max_persons'];
    $s['is_active']         = (bool)$s['is_active'];
    $s['upcoming_bookings'] = (int)$s['upcoming_bookings'];
}

json_response(['slots' => $rows]);
