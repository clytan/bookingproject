<?php
// One-time seed: creates one operator per active water activity, and links each
// activity to its newly-created operator via water_activities.operator_id.
// Default password: operator123 — DELETE this file after running.
require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/plain; charset=utf-8');

$pdo = get_db();
$existing = (int)$pdo->query('SELECT COUNT(*) FROM activity_operators')->fetchColumn();
if ($existing > 0) {
    echo "Operators already exist ($existing). Aborting to avoid duplicates.\n";
    echo "If you need to reset: DELETE FROM activity_operators; then refresh.\n";
    exit;
}

$hash = password_hash('operator123', PASSWORD_BCRYPT);

$activities = $pdo->query('SELECT id, name FROM water_activities WHERE is_active = 1 ORDER BY id')->fetchAll();
$insertOp = $pdo->prepare('INSERT INTO activity_operators (username, email, password_hash, full_name, phone)
                           VALUES (?, ?, ?, ?, ?)');
$linkAct = $pdo->prepare('UPDATE water_activities SET operator_id = ? WHERE id = ?');

$created = [];
foreach ($activities as $a) {
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '_', $a['name']));
    $slug = trim($slug, '_');
    $username = 'op_' . $slug;
    $email    = 'operator+' . $a['id'] . '@cokalo.com';
    $insertOp->execute([
        $username,
        $email,
        $hash,
        'Operator — ' . $a['name'],
        '+91 99 000 0000',
    ]);
    $op_id = (int)$pdo->lastInsertId();
    $linkAct->execute([$op_id, (int)$a['id']]);
    $created[] = ['activity' => $a['name'], 'username' => $username, 'email' => $email];
}

echo "✅ Seeded " . count($created) . " operator accounts (one per existing activity). Password: operator123\n\n";
foreach ($created as $c) {
    echo sprintf("  %-45s username: %s\n", $c['activity'], $c['username']);
}
echo "\nOperators can now log in and add more activities to their company.\n";
echo "⚠️  DELETE this seed.php file after running.\n";
