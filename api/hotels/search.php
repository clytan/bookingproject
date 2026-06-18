<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$city          = trim($_GET['city']     ?? '');
$checkin       = trim($_GET['checkin']  ?? '');
$checkout      = trim($_GET['checkout'] ?? '');
$guests        = max(1, (int)($_GET['guests'] ?? 1));
$property_type = trim($_GET['property_type'] ?? '');
$amenities     = trim($_GET['amenities'] ?? '');

$nights = 1;
if ($checkin && $checkout) {
    try {
        $in  = new DateTime($checkin);
        $out = new DateTime($checkout);
        $diff = (int)$in->diff($out)->format('%a');
        $nights = max(1, $diff);
    } catch (Exception $e) { /* keep nights=1 */ }
}

$pdo = get_db();

$sql = 'SELECT h.*,
               (SELECT MIN(price_per_night) FROM hotel_rooms r
                 WHERE r.hotel_id = h.id AND r.is_active = 1 AND r.capacity >= ?) AS from_price
        FROM hotels h
        WHERE h.is_active = 1';
$params = [$guests];

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

$sql .= ' HAVING from_price IS NOT NULL ORDER BY h.user_rating DESC, h.name ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$hotels = $stmt->fetchAll();

foreach ($hotels as &$h) {
    $h['id']           = (int)$h['id'];
    $h['star_rating']  = (int)$h['star_rating'];
    $h['user_rating']  = (float)$h['user_rating'];
    $h['from_price']   = (float)$h['from_price'];
    $h['total_price']  = $h['from_price'] * $nights;
}

json_response([
    'criteria' => [
        'city'          => $city,
        'checkin'       => $checkin,
        'checkout'      => $checkout,
        'guests'        => $guests,
        'nights'        => $nights,
        'property_type' => $property_type,
        'amenities'     => $amenities,
    ],
    'hotels' => $hotels,
]);
