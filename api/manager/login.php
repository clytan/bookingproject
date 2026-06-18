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
$stmt = $pdo->prepare('SELECT m.id, m.username, m.email, m.password_hash, m.full_name, m.hotel_id, m.is_active,
                              h.name AS hotel_name, h.city AS hotel_city
                       FROM hotel_managers m
                       JOIN hotels h ON h.id = m.hotel_id
                       WHERE m.username = ? OR m.email = ?
                       LIMIT 1');
$stmt->execute([$username, $username]);
$mgr = $stmt->fetch();

if (!$mgr || !password_verify($password, $mgr['password_hash'])) {
    json_error('Invalid username or password', 401);
}
if (!(int)$mgr['is_active']) json_error('Account disabled', 403);

$pdo->prepare('UPDATE hotel_managers SET last_login = NOW() WHERE id = ?')
    ->execute([$mgr['id']]);

$token = jwt_encode([
    'sub'      => (int)$mgr['id'],
    'type'     => 'manager',
    'hotel_id' => (int)$mgr['hotel_id'],
]);

json_response([
    'token' => $token,
    'manager' => [
        'id'         => (int)$mgr['id'],
        'username'   => $mgr['username'],
        'email'      => $mgr['email'],
        'full_name'  => $mgr['full_name'],
        'hotel_id'   => (int)$mgr['hotel_id'],
        'hotel_name' => $mgr['hotel_name'],
        'hotel_city' => $mgr['hotel_city'],
    ],
]);
