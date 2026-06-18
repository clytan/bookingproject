<?php
// =============================================================
// Common helpers — CORS, JSON I/O, error responses
// =============================================================

function cors_headers() {
    // Static allowlist: localhost dev + production domains.
    $allowed = [
        'http://localhost:3000',  'http://localhost:3001',
        'http://localhost:3002',  'http://localhost:3003',
        'http://127.0.0.1:3000',  'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',  'http://127.0.0.1:3003',
        'https://codersdek.com',  'https://www.codersdek.com',
    ];
    // Extra origins from env: comma-separated list, e.g.
    //   CORS_ORIGINS=https://myapp.com,https://staging.myapp.com
    $env = getenv('CORS_ORIGINS');
    if ($env) {
        foreach (explode(',', $env) as $o) {
            $o = trim($o);
            if ($o !== '') $allowed[] = $o;
        }
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $ok = in_array($origin, $allowed, true)
        // Any vercel.app subdomain (preview + production deployments)
        || preg_match('#^https://[a-z0-9-]+\.vercel\.app$#i', $origin);

    if ($ok && $origin) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function json_response($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function json_error($message, $status = 400, $extra = []) {
    json_response(array_merge(['error' => $message], $extra), $status);
}

function read_json_body() {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_method($method) {
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        json_error('Method not allowed', 405);
    }
}
