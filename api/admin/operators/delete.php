<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
require_admin_auth();

$body = read_json_body();
$id = (int)($body['id'] ?? 0);
if ($id <= 0) json_error('id required', 400);

$pdo = get_db();

// Refuse delete if the operator still owns active activities — admin must reassign first
$still = $pdo->prepare('SELECT COUNT(*) FROM water_activities WHERE operator_id = ?');
$still->execute([$id]);
if ((int)$still->fetchColumn() > 0) {
    json_error('This operator still owns activities. Reassign or delete those first.', 409);
}

$stmt = $pdo->prepare('DELETE FROM activity_operators WHERE id = ?');
$stmt->execute([$id]);
json_response(['id' => $id, 'deleted' => $stmt->rowCount() > 0]);
