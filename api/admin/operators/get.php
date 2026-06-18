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
$stmt = $pdo->prepare('SELECT id, username, email, full_name, phone, commission_percent, is_active, last_login, created_at
                       FROM activity_operators WHERE id = ? LIMIT 1');
$stmt->execute([$id]);
$op = $stmt->fetch();
if (!$op) json_error('Operator not found', 404);

$op['id']                 = (int)$op['id'];
$op['commission_percent'] = (float)($op['commission_percent'] ?? 0);
$op['is_active']          = (bool)$op['is_active'];

$acts = $pdo->prepare('SELECT id, name, city, category, is_active FROM water_activities
                       WHERE operator_id = ? ORDER BY name ASC');
$acts->execute([$id]);
$activities = $acts->fetchAll();
foreach ($activities as &$a) {
    $a['id']        = (int)$a['id'];
    $a['is_active'] = (bool)$a['is_active'];
}

json_response(['operator' => $op, 'activities' => $activities]);
