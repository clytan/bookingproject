<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');

$payload = require_user_auth();

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ? LIMIT 1');
$stmt->execute([$payload['sub']]);
$user = $stmt->fetch();

if (!$user) json_error('User not found', 404);

$user['id'] = (int)$user['id'];
json_response(['user' => $user]);
