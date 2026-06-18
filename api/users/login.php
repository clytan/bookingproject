<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('POST');

$body = read_json_body();
$email    = trim(strtolower($body['email'] ?? ''));
$password = $body['password'] ?? '';

if ($email === '' || $password === '') {
    json_error('Email and password are required', 400);
}

$pdo = get_db();
$stmt = $pdo->prepare('SELECT id, name, email, phone, password_hash FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_error('Invalid email or password', 401);
}

$token = jwt_encode(['sub' => (int)$user['id'], 'type' => 'user']);

json_response([
    'token' => $token,
    'user'  => [
        'id'    => (int)$user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'],
    ],
]);
