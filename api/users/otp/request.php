<?php
// Request an email OTP for login or signup
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/email.php';

cors_headers();
require_method('POST');

$body    = read_json_body();
$email   = strtolower(trim($body['email']   ?? ''));
$purpose = trim($body['purpose'] ?? '');

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('A valid email is required', 400);
}
if (!in_array($purpose, ['login', 'signup'], true)) {
    json_error('purpose must be "login" or "signup"', 400);
}

$pdo = get_db();

// Check user existence vs purpose
$exists = $pdo->prepare('SELECT id, name FROM users WHERE email = ? LIMIT 1');
$exists->execute([$email]);
$user = $exists->fetch();

if ($purpose === 'login' && !$user) {
    json_error('No account found for this email. Please sign up first.', 404);
}
if ($purpose === 'signup' && $user) {
    json_error('An account with this email already exists. Please log in.', 409);
}

// Rate limit: max 3 OTPs per email per 10 minutes; respect resend cooldown
$rate = $pdo->prepare("SELECT COUNT(*) FROM otp_codes
                       WHERE email = ? AND created_at > (NOW() - INTERVAL 10 MINUTE)");
$rate->execute([$email]);
if ((int)$rate->fetchColumn() >= 3) {
    json_error('Too many requests. Please wait a few minutes.', 429);
}
$last = $pdo->prepare("SELECT created_at FROM otp_codes
                       WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1");
$last->execute([$email, $purpose]);
$lastCreatedAt = $last->fetchColumn();
if ($lastCreatedAt) {
    $elapsed = time() - strtotime($lastCreatedAt);
    if ($elapsed < OTP_RESEND_COOLDOWN) {
        $wait = OTP_RESEND_COOLDOWN - $elapsed;
        json_error("Please wait {$wait}s before requesting another code.", 429);
    }
}

// Invalidate any prior unused OTPs for this (email, purpose)
$pdo->prepare('UPDATE otp_codes SET used = 1
               WHERE email = ? AND purpose = ? AND used = 0')
    ->execute([$email, $purpose]);

$code   = otp_generate_code();
$expiry = date('Y-m-d H:i:s', time() + OTP_LIFETIME);
$ins = $pdo->prepare('INSERT INTO otp_codes (email, code, purpose, expires_at)
                      VALUES (?, ?, ?, ?)');
$ins->execute([$email, $code, $purpose, $expiry]);

$result = send_otp_email($email, $user['name'] ?? '', $code);
if (!$result['sent']) {
    $pdo->prepare('DELETE FROM otp_codes WHERE id = ?')
        ->execute([(int)$pdo->lastInsertId()]);
    json_error('Failed to send email: ' . ($result['error'] ?? 'unknown'), 502);
}

$response = [
    'sent'       => true,
    'email'      => $email,
    'purpose'    => $purpose,
    'expires_in' => OTP_LIFETIME,
    'provider'   => $result['provider'],
];
if ($result['dev_code']) $response['dev_code'] = $result['dev_code'];

json_response($response);
