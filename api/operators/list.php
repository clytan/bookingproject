<?php
// Public: list water-sports companies. Filterable by category and city.
// Returns each company with the set of categories they offer + cities they're in.
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';

cors_headers();
require_method('GET');

$category = trim($_GET['category'] ?? '');  // comma-separated
$city     = trim($_GET['city']     ?? '');
$search   = trim($_GET['search']   ?? '');

$pdo = get_db();

// Only operators that have at least one active activity show up
$sql = 'SELECT o.id, o.username, o.full_name,
               COUNT(DISTINCT a.id)       AS activity_count,
               GROUP_CONCAT(DISTINCT a.city ORDER BY a.city)     AS cities,
               GROUP_CONCAT(DISTINCT a.category ORDER BY a.category) AS categories,
               MAX(a.user_rating)         AS top_rating,
               (SELECT MIN(s.price_per_person)
                  FROM activity_slots s
                  JOIN water_activities aa ON aa.id = s.activity_id
                 WHERE aa.operator_id = o.id AND aa.is_active = 1 AND s.is_active = 1) AS from_price,
               (SELECT a2.image_url FROM water_activities a2
                 WHERE a2.operator_id = o.id AND a2.is_active = 1 AND a2.image_url IS NOT NULL
                 ORDER BY a2.user_rating DESC LIMIT 1) AS cover_image
        FROM activity_operators o
        JOIN water_activities a ON a.operator_id = o.id AND a.is_active = 1
        WHERE o.is_active = 1';
$params = [];

if ($category !== '') {
    $cats = array_filter(array_map('trim', explode(',', $category)));
    if ($cats) {
        // Restrict to operators that have AT LEAST ONE matching activity
        $placeholders = implode(',', array_fill(0, count($cats), '?'));
        $sql .= " AND o.id IN (SELECT a3.operator_id FROM water_activities a3
                               WHERE a3.is_active = 1 AND a3.category IN ($placeholders))";
        foreach ($cats as $c) $params[] = $c;
    }
}

if ($city !== '') {
    $sql .= ' AND o.id IN (SELECT a4.operator_id FROM water_activities a4
                           WHERE a4.is_active = 1 AND a4.city LIKE ?)';
    $params[] = '%' . $city . '%';
}

if ($search !== '') {
    $sql .= ' AND o.full_name LIKE ?';
    $params[] = '%' . $search . '%';
}

$sql .= ' GROUP BY o.id ORDER BY top_rating DESC, o.full_name ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

foreach ($rows as &$o) {
    $o['id']             = (int)$o['id'];
    $o['activity_count'] = (int)$o['activity_count'];
    $o['top_rating']     = $o['top_rating'] !== null ? (float)$o['top_rating'] : null;
    $o['from_price']     = $o['from_price'] !== null ? (float)$o['from_price'] : null;
    $o['cities']         = $o['cities']     !== null ? explode(',', $o['cities'])     : [];
    $o['categories']     = $o['categories'] !== null ? explode(',', $o['categories']) : [];
}

json_response(['operators' => $rows]);
