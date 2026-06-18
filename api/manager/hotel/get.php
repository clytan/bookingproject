<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('GET');
$payload  = require_manager_auth();
$hotel_id = (int)$payload['hotel_id'];

$pdo = get_db();
$stmt = $pdo->prepare('SELECT * FROM hotels WHERE id = ? LIMIT 1');
$stmt->execute([$hotel_id]);
$hotel = $stmt->fetch();
if (!$hotel) json_error('Hotel not found', 404);

$hotel['id']          = (int)$hotel['id'];
$hotel['star_rating'] = (int)$hotel['star_rating'];
$hotel['user_rating'] = (float)$hotel['user_rating'];
$hotel['is_active']   = (bool)$hotel['is_active'];

json_response(['hotel' => $hotel]);
