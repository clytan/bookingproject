<?php
// =============================================================
// Minimal HS256 JWT helper (no external deps, no composer needed)
// =============================================================

define('JWT_SECRET', 'change-this-to-a-long-random-string-in-production');
define('JWT_EXPIRY', 60 * 60 * 8); // 8 hours

function base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_encode(array $payload) {
    $header  = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload['iat'] = time();
    $payload['exp'] = time() + JWT_EXPIRY;

    $h = base64url_encode(json_encode($header));
    $p = base64url_encode(json_encode($payload));
    $sig = hash_hmac('sha256', "$h.$p", JWT_SECRET, true);
    $s = base64url_encode($sig);
    return "$h.$p.$s";
}

function jwt_decode($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$h, $p, $s] = $parts;

    $expected = base64url_encode(hash_hmac('sha256', "$h.$p", JWT_SECRET, true));
    if (!hash_equals($expected, $s)) return null;

    $payload = json_decode(base64url_decode($p), true);
    if (!$payload) return null;
    if (isset($payload['exp']) && $payload['exp'] < time()) return null;

    return $payload;
}

function get_bearer_token() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!$auth && isset($_SERVER['HTTP_AUTHORIZATION'])) $auth = $_SERVER['HTTP_AUTHORIZATION'];
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) return trim($m[1]);
    return null;
}

function require_admin_auth() {
    $token = get_bearer_token();
    if (!$token) json_error('Unauthorized', 401);
    $payload = jwt_decode($token);
    if (!$payload || ($payload['type'] ?? '') !== 'admin') json_error('Invalid or expired token', 401);
    return $payload;
}

function require_user_auth() {
    $token = get_bearer_token();
    if (!$token) json_error('Unauthorized', 401);
    $payload = jwt_decode($token);
    if (!$payload || ($payload['type'] ?? '') !== 'user') json_error('Invalid or expired token', 401);
    return $payload;
}

function require_manager_auth() {
    $token = get_bearer_token();
    if (!$token) json_error('Unauthorized', 401);
    $payload = jwt_decode($token);
    if (!$payload || ($payload['type'] ?? '') !== 'manager') json_error('Invalid or expired token', 401);
    return $payload;
}

function require_operator_auth() {
    $token = get_bearer_token();
    if (!$token) json_error('Unauthorized', 401);
    $payload = jwt_decode($token);
    if (!$payload || ($payload['type'] ?? '') !== 'operator') json_error('Invalid or expired token', 401);
    return $payload;
}
