<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$ALLOWED_CAT  = ['snorkeling','scuba_diving','surfing','jet_ski','kayaking',
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
$image_url    = trim($body['image_url']    ?? '');
$includes     = trim($body['includes']     ?? '');
$is_active    = (int)!!($body['is_active'] ?? true);

if (!in_array($category, $ALLOWED_CAT, true))   $category   = 'other';
if (!in_array($difficulty, $ALLOWED_DIFF, true)) $difficulty = 'beginner';

if ($name === '' || $city === '') json_error('Name and city are required', 400);

$pdo = get_db();

if ($id > 0) {
    // Ownership check
    $own = $pdo->prepare('SELECT operator_id FROM water_activities WHERE id = ?');
    $own->execute([$id]);
    $owner = $own->fetchColumn();
    if ($owner === false) json_error('Activity not found', 404);
    if ((int)$owner !== $op_id) json_error('Forbidden', 403);

    $stmt = $pdo->prepare('UPDATE water_activities SET name=?, city=?, category=?, address=?, description=?,
        difficulty=?, duration_min=?, image_url=?, includes=?, is_active=? WHERE id=?');
    $stmt->execute([
        $name, $city, $category, $address ?: null, $description ?: null,
        $difficulty, $duration_min, $image_url ?: null, $includes ?: null, $is_active, $id,
    ]);
    json_response(['id' => $id, 'updated' => true]);
} else {
    // New activity owned by this operator. user_rating defaults to 4.0 (admin can adjust later).
    $stmt = $pdo->prepare('INSERT INTO water_activities
        (name, city, operator_id, category, address, description, difficulty, duration_min, image_url, includes, is_active)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $name, $city, $op_id, $category, $address ?: null, $description ?: null,
        $difficulty, $duration_min, $image_url ?: null, $includes ?: null, $is_active,
    ]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
