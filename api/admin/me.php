<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');

$payload = require_admin_auth();

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id, username, email, full_name, role, last_login
                       FROM admin_users WHERE id = ? LIMIT 1');
$stmt->execute([$payload['sub']]);
$admin = $stmt->fetch();

if (!$admin) json_error('Admin not found', 404);

$admin['id'] = (int)$admin['id'];
json_response(['admin' => $admin]);
