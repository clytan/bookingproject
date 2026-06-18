<?php
// Verify an email OTP. On success, returns a JWT + user record.
// For signup, also requires {name} to create the account.
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';
require_once __DIR__ . '/../../config/email.php';

cors_headers();
require_method('POST');

$body    = read_json_body();
$email    = strtolower(trim($body['email'] ?? ''));
$code     = preg_replace('/\D/', '', (string)($body['code'] ?? ''));
$purpose  = trim($body['purpose']  ?? '');
$name     = trim($body['name']     ?? '');
$phone    = trim($body['phone']    ?? '');
$password = (string)($body['password'] ?? '');

if ($email === '' || $code === '' || !in_array($purpose, ['login','signup'], true)) {
    json_error('email, code, and purpose are required', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Invalid email', 400);
}

$pdo = get_db();
$pdo->beginTransaction();

try {
    $sel = $pdo->prepare('SELECT * FROM otp_codes
                          WHERE email = ? AND purpose = ? AND used = 0
                          ORDER BY id DESC LIMIT 1 FOR UPDATE');
    $sel->execute([$email, $purpose]);
    $otp = $sel->fetch();

    if (!$otp) {
        throw new RuntimeException('No active OTP for this email. Request a new code.');
    }
    if ((int)$otp['attempts'] >= 5) {
        $pdo->prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')->execute([$otp['id']]);
        throw new RuntimeException('Too many attempts. Request a new code.');
    }
    if (strtotime($otp['expires_at']) < time()) {
        $pdo->prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')->execute([$otp['id']]);
        throw new RuntimeException('Code expired. Request a new one.');
    }
    if (!hash_equals($otp['code'], $code)) {
        $pdo->prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?')->execute([$otp['id']]);
        throw new RuntimeException('Incorrect code. Try again.');
    }

    // Mark consumed
    $pdo->prepare('UPDATE otp_codes SET used = 1 WHERE id = ?')->execute([$otp['id']]);

    if ($purpose === 'signup') {
        if ($name === '') throw new RuntimeException('Name is required for signup.');
        if ($password !== '' && strlen($password) < 6) {
            throw new RuntimeException('Password must be at least 6 characters.');
        }
        $dup = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $dup->execute([$email]);
        if ($dup->fetch()) throw new RuntimeException('This email is already registered.');

        $hash = $password !== '' ? password_hash($password, PASSWORD_BCRYPT) : null;
        $ins = $pdo->prepare('INSERT INTO users (name, email, email_verified, phone, password_hash)
                              VALUES (?, ?, 1, ?, ?)');
        $ins->execute([$name, $email, $phone ?: null, $hash]);
        $userId = (int)$pdo->lastInsertId();
    } else {
        $find = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
        $find->execute([$email]);
        $u = $find->fetch();
        if (!$u) throw new RuntimeException('No account found for this email.');
        $userId = (int)$u['id'];
        $pdo->prepare('UPDATE users SET email_verified = 1 WHERE id = ? AND email_verified = 0')
            ->execute([$userId]);
    }

    $u = $pdo->prepare('SELECT id, name, email, phone, email_verified FROM users WHERE id = ?');
    $u->execute([$userId]);
    $user = $u->fetch();

    $pdo->commit();

    $token = jwt_encode([
        'sub'  => (int)$user['id'],
        'type' => 'user',
    ]);

    json_response([
        'token' => $token,
        'user'  => [
            'id'             => (int)$user['id'],
            'name'           => $user['name'],
            'email'          => $user['email'],
            'phone'          => $user['phone'],
            'email_verified' => (bool)$user['email_verified'],
        ],
    ]);
} catch (RuntimeException $e) {
    $pdo->commit();   // keep the attempts/used flips even on user-facing rejections
    json_error($e->getMessage(), 400);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_error('Verification failed: ' . $e->getMessage(), 500);
}
