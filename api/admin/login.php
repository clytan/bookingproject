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
$stmt = $pdo->prepare('SELECT id, username, email, password_hash, full_name, role, is_active
                       FROM admin_users
                       WHERE username = ? OR email = ?
                       LIMIT 1');
$stmt->execute([$username, $username]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    json_error('Invalid username or password', 401);
}

if (!(int)$admin['is_active']) {
    json_error('Account disabled', 403);
}

$pdo->prepare('UPDATE admin_users SET last_login = NOW() WHERE id = ?')
    ->execute([$admin['id']]);

$token = jwt_encode([
    'sub'  => (int)$admin['id'],
    'type' => 'admin',
    'role' => $admin['role'],
]);

json_response([
    'token' => $token,
    'admin' => [
        'id'        => (int)$admin['id'],
        'username'  => $admin['username'],
        'email'     => $admin['email'],
        'full_name' => $admin['full_name'],
        'role'      => $admin['role'],
    ],
]);
