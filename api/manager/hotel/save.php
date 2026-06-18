<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$body = read_json_body();
$name        = trim($body['name']        ?? '');
$city        = trim($body['city']        ?? '');
$address     = trim($body['address']     ?? '');
$description = trim($body['description'] ?? '');
$image_url   = trim($body['image_url']   ?? '');
$amenities   = trim($body['amenities']   ?? '');

if ($name === '' || $city === '') json_error('Name and city are required', 400);

// Managers can edit profile fields but NOT star/user rating (admin-only) and NOT is_active
$pdo = get_db();
$stmt = $pdo->prepare('UPDATE hotels SET name=?, city=?, address=?, description=?, image_url=?, amenities=? WHERE id=?');
$stmt->execute([$name, $city, $address ?: null, $description ?: null, $image_url ?: null, $amenities ?: null, $hotel_id]);

json_response(['id' => $hotel_id, 'updated' => true]);
