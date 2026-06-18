<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$body      = read_json_body();
$id        = (int)($body['id'] ?? 0);
$username  = trim($body['username']  ?? '');
$email     = trim($body['email']     ?? '');
$full_name = trim($body['full_name'] ?? '');
$phone     = trim($body['phone']     ?? '');
$password  = (string)($body['password'] ?? '');
$commission_percent = max(0.0, min(100.0, (float)($body['commission_percent'] ?? 0)));
$is_active = (int)!!($body['is_active'] ?? true);

if ($username === '' || $email === '' || $full_name === '') {
    json_error('Username, email and full name are required', 400);
}

$pdo = get_db();

if ($id > 0) {
    // Update — duplicate check excludes self
    $dup = $pdo->prepare('SELECT id FROM activity_operators WHERE (username = ? OR email = ?) AND id != ? LIMIT 1');
    $dup->execute([$username, $email, $id]);
    if ($dup->fetch()) json_error('Username or email already in use', 409);

    if ($password !== '') {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('UPDATE activity_operators SET username=?, email=?, full_name=?, phone=?, password_hash=?, commission_percent=?, is_active=? WHERE id=?');
        $stmt->execute([$username, $email, $full_name, $phone ?: null, $hash, $commission_percent, $is_active, $id]);
    } else {
        $stmt = $pdo->prepare('UPDATE activity_operators SET username=?, email=?, full_name=?, phone=?, commission_percent=?, is_active=? WHERE id=?');
        $stmt->execute([$username, $email, $full_name, $phone ?: null, $commission_percent, $is_active, $id]);
    }
    json_response(['id' => $id, 'updated' => true]);
} else {
    if ($password === '' || strlen($password) < 6) {
        json_error('Password (min 6 chars) is required for new operators', 400);
    }
    $dup = $pdo->prepare('SELECT id FROM activity_operators WHERE username = ? OR email = ? LIMIT 1');
    $dup->execute([$username, $email]);
    if ($dup->fetch()) json_error('Username or email already in use', 409);

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO activity_operators (username, email, password_hash, full_name, phone, commission_percent, is_active)
                           VALUES (?,?,?,?,?,?,?)');
    $stmt->execute([$username, $email, $hash, $full_name, $phone ?: null, $commission_percent, $is_active]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
