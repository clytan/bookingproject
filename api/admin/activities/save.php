<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$ALLOWED_CAT = ['snorkeling','scuba_diving','surfing','jet_ski','kayaking',
                'whale_watching','banana_boat','parasailing','catamaran_sailing','other'];
$ALLOWED_DIFF = ['beginner','intermediate','advanced'];

$body         = read_json_body();
$id           = (int)($body['id'] ?? 0);
$name         = trim($body['name']         ?? '');
$city         = trim($body['city']         ?? '');
$category     = trim($body['category']     ?? 'other');
$address      = trim($body['address']      ?? '');
$description  = trim($body['description']  ?? '');
$difficulty   = trim($body['difficulty']   ?? 'beginner');
$duration_min = max(1, (int)($body['duration_min'] ?? 60));
$user_rating  = max(0.0, min(5.0, (float)($body['user_rating'] ?? 4.0)));
$image_url    = trim($body['image_url']    ?? '');
$includes     = trim($body['includes']     ?? '');
$is_active    = (int)!!($body['is_active'] ?? true);
$operator_id  = isset($body['operator_id']) && $body['operator_id'] !== '' && $body['operator_id'] !== null
                  ? (int)$body['operator_id'] : null;

if (!in_array($category, $ALLOWED_CAT, true))   $category   = 'other';
if (!in_array($difficulty, $ALLOWED_DIFF, true)) $difficulty = 'beginner';

if ($name === '' || $city === '') json_error('Name and city are required', 400);

$pdo = get_db();

// Validate operator_id if provided
if ($operator_id !== null) {
    $check = $pdo->prepare('SELECT id FROM activity_operators WHERE id = ? LIMIT 1');
    $check->execute([$operator_id]);
    if (!$check->fetch()) json_error('Operator not found', 400);
}

if ($id > 0) {
    $exists = $pdo->prepare('SELECT id FROM water_activities WHERE id = ? LIMIT 1');
    $exists->execute([$id]);
    if (!$exists->fetch()) json_error('Activity not found', 404);

    $stmt = $pdo->prepare('UPDATE water_activities SET name=?, city=?, operator_id=?, category=?, address=?, description=?,
        difficulty=?, duration_min=?, user_rating=?, image_url=?, includes=?, is_active=? WHERE id=?');
    $stmt->execute([
        $name, $city, $operator_id, $category, $address ?: null, $description ?: null,
        $difficulty, $duration_min, $user_rating, $image_url ?: null, $includes ?: null, $is_active, $id,
    ]);
    json_response(['id' => $id, 'updated' => true]);
} else {
    $stmt = $pdo->prepare('INSERT INTO water_activities
        (name, city, operator_id, category, address, description, difficulty, duration_min, user_rating, image_url, includes, is_active)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $name, $city, $operator_id, $category, $address ?: null, $description ?: null,
        $difficulty, $duration_min, $user_rating, $image_url ?: null, $includes ?: null, $is_active,
    ]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
