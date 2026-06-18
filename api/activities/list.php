<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$city        = trim($_GET['city']        ?? '');
$category    = trim($_GET['category']    ?? '');   // comma-separated
$difficulty  = trim($_GET['difficulty']  ?? '');   // comma-separated
$includes    = trim($_GET['includes']    ?? '');   // comma-separated, ALL must match

$pdo = get_db();

$sql = 'SELECT a.*, o.full_name AS operator_name,
               (SELECT MIN(price_per_person) FROM activity_slots s
                 WHERE s.activity_id = a.id AND s.is_active = 1) AS from_price
        FROM water_activities a
        LEFT JOIN activity_operators o ON o.id = a.operator_id
        WHERE a.is_active = 1';
$params = [];

if ($city !== '') {
    $sql .= ' AND a.city LIKE ?';
    $params[] = '%' . $city . '%';
}

if ($category !== '') {
    $cats = array_filter(array_map('trim', explode(',', $category)));
    if ($cats) {
        $placeholders = implode(',', array_fill(0, count($cats), '?'));
        $sql .= " AND a.category IN ($placeholders)";
        foreach ($cats as $c) $params[] = $c;
    }
}

if ($difficulty !== '') {
    $diffs = array_filter(array_map('trim', explode(',', $difficulty)));
    if ($diffs) {
        $placeholders = implode(',', array_fill(0, count($diffs), '?'));
        $sql .= " AND a.difficulty IN ($placeholders)";
        foreach ($diffs as $d) $params[] = $d;
    }
}

if ($includes !== '') {
    $list = array_filter(array_map('trim', explode(',', $includes)));
    foreach ($list as $inc) {
        $sql .= ' AND a.includes LIKE ?';
        $params[] = '%' . $inc . '%';
    }
}

$sql .= ' ORDER BY a.user_rating DESC, a.name ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

foreach ($rows as &$a) {
    $a['id']           = (int)$a['id'];
    $a['operator_id']  = $a['operator_id'] !== null ? (int)$a['operator_id'] : null;
    $a['duration_min'] = (int)$a['duration_min'];
    $a['user_rating']  = (float)$a['user_rating'];
    $a['from_price']   = $a['from_price'] !== null ? (float)$a['from_price'] : null;
    $a['is_active']    = (bool)$a['is_active'];
}

json_response(['activities' => $rows]);
