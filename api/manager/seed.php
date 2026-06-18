<?php
// One-time seed: creates one manager per active hotel.
// Default password: manager123 — DELETE this file after running.
require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/plain; charset=utf-8');

$pdo = get_db();
$existing = (int)$pdo->query('SELECT COUNT(*) FROM hotel_managers')->fetchColumn();
if ($existing > 0) {
    echo "Managers already exist ($existing). Aborting to avoid duplicates.\n";
    echo "If you need to reset: DELETE FROM hotel_managers; then refresh.\n";
    exit;
}

$hash = password_hash('manager123', PASSWORD_BCRYPT);

$hotels = $pdo->query('SELECT id, name FROM hotels WHERE is_active = 1 ORDER BY id')->fetchAll();
$stmt = $pdo->prepare('INSERT INTO hotel_managers (hotel_id, username, email, password_hash, full_name, phone)
                       VALUES (?, ?, ?, ?, ?, ?)');

$created = [];
foreach ($hotels as $h) {
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '_', $h['name']));
    $slug = trim($slug, '_');
    $username = 'mgr_' . $slug;
    $email    = 'manager+' . $h['id'] . '@cokalo.com';
    $stmt->execute([
        (int)$h['id'],
        $username,
        $email,
        $hash,
        'Manager — ' . $h['name'],
        '+94 77 000 0000',
    ]);
    $created[] = ['hotel' => $h['name'], 'username' => $username, 'email' => $email];
}

echo "✅ Seeded " . count($created) . " manager accounts. Password for all: manager123\n\n";
foreach ($created as $c) {
    echo sprintf("  %-45s username: %s\n", $c['hotel'], $c['username']);
}
echo "\n⚠️  DELETE this seed.php file now for safety.\n";
