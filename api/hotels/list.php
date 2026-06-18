<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$city          = trim($_GET['city'] ?? '');
$property_type = trim($_GET['property_type'] ?? '');   // comma-separated list
$amenities     = trim($_GET['amenities'] ?? '');       // comma-separated, ALL must match
$min_capacity  = (int)($_GET['min_capacity'] ?? 0);

$pdo = get_db();

$sql = 'SELECT h.*,
               (SELECT MIN(price_per_night) FROM hotel_rooms r
                 WHERE r.hotel_id = h.id AND r.is_active = 1'
       . ($min_capacity > 0 ? ' AND r.capacity >= ?' : '') . ') AS from_price
        FROM hotels h
        WHERE h.is_active = 1';
$params = [];
if ($min_capacity > 0) $params[] = $min_capacity;

if ($city !== '') {
    $sql .= ' AND h.city LIKE ?';
    $params[] = '%' . $city . '%';
}

if ($property_type !== '') {
    $types = array_filter(array_map('trim', explode(',', $property_type)));
    if ($types) {
        $placeholders = implode(',', array_fill(0, count($types), '?'));
        $sql .= " AND h.property_type IN ($placeholders)";
        foreach ($types as $t) $params[] = $t;
    }
}

if ($amenities !== '') {
    $list = array_filter(array_map('trim', explode(',', $amenities)));
    foreach ($list as $a) {
        $sql .= ' AND h.amenities LIKE ?';
        $params[] = '%' . $a . '%';
    }
}

if ($min_capacity > 0) {
    $sql .= ' HAVING from_price IS NOT NULL';
}

$sql .= ' ORDER BY h.user_rating DESC, h.name ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$hotels = $stmt->fetchAll();

foreach ($hotels as &$h) {
    $h['id']          = (int)$h['id'];
    $h['star_rating'] = (int)$h['star_rating'];
    $h['user_rating'] = (float)$h['user_rating'];
    $h['from_price']  = $h['from_price'] !== null ? (float)$h['from_price'] : null;
}

json_response(['hotels' => $hotels]);
