<?php
// =============================================================
// Database connection (PDO)
// Edit these for local XAMPP or GoDaddy production.
// =============================================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'busgo_db');
define('DB_USER', 'root');     // XAMPP default
define('DB_PASS', '');         // XAMPP default (empty)
define('DB_CHARSET', 'utf8mb4');

function get_db() {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Database connection failed', 'detail' => $e->getMessage()]);
        exit;
    }

    return $pdo;
}
