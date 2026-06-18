<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) json_error('Activity id is required', 400);

$pdo = get_db();

$stmt = $pdo->prepare('SELECT a.*, o.full_name AS operator_name
                       FROM water_activities a
                       LEFT JOIN activity_operators o ON o.id = a.operator_id
                       WHERE a.id = ? AND a.is_active = 1 LIMIT 1');
$stmt->execute([$id]);
$activity = $stmt->fetch();
if (!$activity) json_error('Activity not found', 404);

$slots = $pdo->prepare('SELECT * FROM activity_slots WHERE activity_id = ? AND is_active = 1 ORDER BY departure_time ASC');
$slots->execute([$id]);
$slots = $slots->fetchAll();

$activity['id']           = (int)$activity['id'];
$activity['operator_id']  = $activity['operator_id'] !== null ? (int)$activity['operator_id'] : null;
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
