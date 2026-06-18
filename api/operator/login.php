<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('POST');

$body = read_json_body();
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if ($username === '' || $password === '') {
    json_error('Username and password are required', 400);
}

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id, username, email, password_hash, full_name, is_active
                       FROM activity_operators
                       WHERE username = ? OR email = ?
                       LIMIT 1');
$stmt->execute([$username, $username]);
$op = $stmt->fetch();

if (!$op || !password_verify($password, $op['password_hash'])) {
    json_error('Invalid username or password', 401);
}
if (!(int)$op['is_active']) json_error('Account disabled', 403);

$pdo->prepare('UPDATE activity_operators SET last_login = NOW() WHERE id = ?')->execute([$op['id']]);

$token = jwt_encode([
    'sub'  => (int)$op['id'],
    'type' => 'operator',
]);

// Count activities to surface in login response (handy for the UI)
$cnt = $pdo->prepare('SELECT COUNT(*) FROM water_activities WHERE operator_id = ?');
$cnt->execute([(int)$op['id']]);

json_response([
    'token' => $token,
    'operator' => [
        'id'             => (int)$op['id'],
        'username'       => $op['username'],
        'email'          => $op['email'],
        'full_name'      => $op['full_name'],
        'activity_count' => (int)$cnt->fetchColumn(),
    ],
]);
