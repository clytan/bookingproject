<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');

$payload = require_operator_auth();

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id, username, email, full_name, phone
                       FROM activity_operators WHERE id = ? LIMIT 1');
$stmt->execute([$payload['sub']]);
$op = $stmt->fetch();
if (!$op) json_error('Operator not found', 404);

$cnt = $pdo->prepare('SELECT COUNT(*) FROM water_activities WHERE operator_id = ?');
$cnt->execute([(int)$op['id']]);

$op['id']             = (int)$op['id'];
$op['activity_count'] = (int)$cnt->fetchColumn();

json_response(['operator' => $op]);
