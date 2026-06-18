<?php
// Public endpoint: company profile + their active activities
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$id           = (int)($_GET['id'] ?? 0);
$cat_filter   = trim($_GET['category'] ?? '');
$city_filter  = trim($_GET['city']     ?? '');
if ($id <= 0) json_error('Operator id is required', 400);

$pdo = get_db();

// Public fields only — no email/phone leak
$stmt = $pdo->prepare('SELECT id, username, full_name FROM activity_operators
                       WHERE id = ? AND is_active = 1 LIMIT 1');
$stmt->execute([$id]);
$op = $stmt->fetch();
if (!$op) json_error('Operator not found', 404);

// All their active activities + cheapest slot price.
// Optionally annotate each row with `highlight=1` when it matches the user's search filter.
$sql = 'SELECT a.id, a.name, a.city, a.category, a.description,
               a.difficulty, a.duration_min, a.user_rating, a.image_url, a.includes,
               (SELECT MIN(price_per_person) FROM activity_slots s
                 WHERE s.activity_id = a.id AND s.is_active = 1) AS from_price
        FROM water_activities a
        WHERE a.operator_id = ? AND a.is_active = 1
        ORDER BY a.city ASC, a.user_rating DESC, a.name ASC';
$acts = $pdo->prepare($sql);
$acts->execute([$id]);
$activities = $acts->fetchAll();

// Compute highlight flags so the UI can spotlight what matched the search
$cats_set  = $cat_filter  !== '' ? array_filter(array_map('trim', explode(',', $cat_filter))) : [];
$city_low  = $city_filter !== '' ? strtolower($city_filter) : '';
foreach ($activities as &$_a) {
    $match_cat  = empty($cats_set)  || in_array($_a['category'], $cats_set, true);
    $match_city = empty($city_low)  || stripos($_a['city'], $city_filter) !== false;
    $_a['highlight'] = (int)($match_cat && $match_city);
}
unset($_a);

foreach ($activities as &$a) {
    $a['id']           = (int)$a['id'];
    $a['duration_min'] = (int)$a['duration_min'];
    $a['user_rating']  = (float)$a['user_rating'];
    $a['from_price']   = $a['from_price'] !== null ? (float)$a['from_price'] : null;
}
unset($a); // break the reference before iterating again

// Pre-group by city for the UI
$by_city = [];
foreach ($activities as $a) {
    $by_city[$a['city']][] = $a;
}
$grouped = [];
foreach ($by_city as $city => $list) {
    $grouped[] = ['city' => $city, 'activities' => $list];
}

$op['id'] = (int)$op['id'];

json_response([
    'operator'   => $op,
    'cities'     => array_keys($by_city),
    'grouped'    => $grouped,
    'activities' => $activities,
]);
