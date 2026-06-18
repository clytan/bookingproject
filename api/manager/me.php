<?php
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';

cors_headers();
require_method('GET');

$payload = require_manager_auth();

$pdo = get_db();
$stmt = $pdo->prepare('SELECT m.id, m.username, m.email, m.full_name, m.phone, m.hotel_id,
                              h.name AS hotel_name, h.city AS hotel_city, h.image_url AS hotel_image
                       FROM hotel_managers m
                       JOIN hotels h ON h.id = m.hotel_id
                       WHERE m.id = ? LIMIT 1');
$stmt->execute([$payload['sub']]);
$mgr = $stmt->fetch();
if (!$mgr) json_error('Manager not found', 404);

$mgr['id']       = (int)$mgr['id'];
$mgr['hotel_id'] = (int)$mgr['hotel_id'];
json_response(['manager' => $mgr]);
