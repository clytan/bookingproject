<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$body = read_json_body();
$id          = (int)($body['id'] ?? 0);
$name        = trim($body['name']        ?? '');
$city        = trim($body['city']        ?? '');
$address     = trim($body['address']     ?? '');
$description = trim($body['description'] ?? '');
$star_rating = max(1, min(5, (int)($body['star_rating'] ?? 3)));
$user_rating = max(0.0, min(5.0, (float)($body['user_rating'] ?? 4.0)));
$image_url   = trim($body['image_url']   ?? '');
$amenities   = trim($body['amenities']   ?? '');
$commission_percent = max(0.0, min(100.0, (float)($body['commission_percent'] ?? 0)));
$is_active   = (int)!!($body['is_active'] ?? true);

$ALLOWED_TYPES = ['hotel','resort','service_apartment','independent_house',
                  'villa','guest_house','hostel','boutique_hotel','apartment'];
$property_type = trim($body['property_type'] ?? 'hotel');
if (!in_array($property_type, $ALLOWED_TYPES, true)) $property_type = 'hotel';

if ($name === '' || $city === '') {
    json_error('Name and city are required', 400);
}

$pdo = get_db();

if ($id > 0) {
    $exists = $pdo->prepare('SELECT id FROM hotels WHERE id = ? LIMIT 1');
    $exists->execute([$id]);
    if (!$exists->fetch()) json_error('Hotel not found', 404);

    $stmt = $pdo->prepare('UPDATE hotels SET name=?, city=?, property_type=?, address=?, description=?,
        star_rating=?, user_rating=?, image_url=?, amenities=?, commission_percent=?, is_active=? WHERE id=?');
    $stmt->execute([
        $name, $city, $property_type, $address ?: null, $description ?: null,
        $star_rating, $user_rating, $image_url ?: null, $amenities ?: null, $commission_percent, $is_active, $id,
    ]);
    json_response(['id' => $id, 'updated' => true]);
} else {
    $stmt = $pdo->prepare('INSERT INTO hotels
        (name, city, property_type, address, description, star_rating, user_rating, image_url, amenities, commission_percent, is_active)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([
        $name, $city, $property_type, $address ?: null, $description ?: null,
        $star_rating, $user_rating, $image_url ?: null, $amenities ?: null, $commission_percent, $is_active,
    ]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
