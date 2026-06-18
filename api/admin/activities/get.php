<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
require_admin_auth();

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_error('id required', 400);

$pdo = get_db();
$stmt = $pdo->prepare('SELECT * FROM water_activities WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$activity = $stmt->fetch();
if (!$activity) json_error('Activity not found', 404);

$slots = $pdo->prepare('SELECT * FROM activity_slots WHERE activity_id = ? ORDER BY departure_time ASC');
$slots->execute([$id]);
$slots = $slots->fetchAll();

$activity['id']           = (int)$activity['id'];
$activity['duration_min'] = (int)$activity['duration_min'];
$activity['user_rating']  = (float)$activity['user_rating'];
$activity['is_active']    = (bool)$activity['is_active'];

foreach ($slots as &$s) {
    $s['id']               = (int)$s['id'];
    $s['activity_id']      = (int)$s['activity_id'];
    $s['duration_min']     = (int)$s['duration_min'];
    $s['price_per_person'] = (float)$s['price_per_person'];
    $s['max_persons']      = (int)$s['max_persons'];
    $s['is_active']        = (bool)$s['is_active'];
}

json_response(['activity' => $activity, 'slots' => $slots]);
