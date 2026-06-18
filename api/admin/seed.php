<?php
// =============================================================
// One-time seeder — creates a default admin user.
// Visit this in your browser ONCE: http://localhost/bookingproject/api/admin/seed.php
// Then DELETE this file (or comment out the body) for safety.
// =============================================================

require_once __DIR__ . '/../config/db.php';

header('Content-Type: text/plain; charset=utf-8');

$username  = 'admin';
$email     = 'admin@cokalo.com';
$password  = 'admin123';      // change after first login
$full_name = 'Super Admin';
$role      = 'super_admin';

$pdo = get_db();

// Check if any admin exists
$count = (int)$pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn();
if ($count > 0) {
    echo "An admin user already exists. Aborting to avoid overwriting.\n";
    echo "If you need to reset: DELETE FROM admin_users; then visit this page again.\n";
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare('INSERT INTO admin_users (username, email, password_hash, full_name, role)
                       VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$username, $email, $hash, $full_name, $role]);

echo "✅ Default admin created.\n\n";
echo "  Username: $username\n";
echo "  Password: $password\n\n";
echo "⚠️  Change this password after first login.\n";
echo "⚠️  DELETE this seed.php file now for safety.\n";
