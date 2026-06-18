<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('POST');

$body = read_json_body();
$name     = trim($body['name']     ?? '');
$email    = trim(strtolower($body['email'] ?? ''));
$phone    = trim($body['phone']    ?? '');
$password = $body['password']      ?? '';

if ($name === '' || $email === '' || $password === '') {
    json_error('Name, email and password are required', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Invalid email address', 400);
}
if (strlen($password) < 6) {
    json_error('Password must be at least 6 characters', 400);
}

$pdo = get_db();

$exists = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$exists->execute([$email]);
if ($exists->fetch()) {
    json_error('An account with this email already exists', 409);
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)');
$stmt->execute([$name, $email, $phone ?: null, $hash]);
$id = (int)$pdo->lastInsertId();

$token = jwt_encode(['sub' => $id, 'type' => 'user']);

json_response([
    'token' => $token,
    'user'  => [
        'id'    => $id,
        'name'  => $name,
        'email' => $email,
        'phone' => $phone ?: null,
    ],
], 201);
