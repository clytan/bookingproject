<?php
require_once __DIR__ . '/../../helpers.php';
require_once __DIR__ . '/../../config/db.php';
require_once __DIR__ . '/../../config/jwt.php';

cors_headers();
require_method('POST');
$payload = require_operator_auth();
$op_id   = (int)$payload['sub'];

$body = read_json_body();
$id               = (int)($body['id'] ?? 0);
$activity_id      = (int)($body['activity_id'] ?? 0);
$slot_label       = trim($body['slot_label']  ?? '');
$description      = trim($body['description'] ?? '');
$departure_time   = trim($body['departure_time'] ?? '');
$duration_min     = max(1, (int)($body['duration_min'] ?? 60));
$price_per_person = (float)($body['price_per_person'] ?? 0);
$max_persons      = max(1, (int)($body['max_persons'] ?? 1));
$image_url        = trim($body['image_url'] ?? '');
$includes         = trim($body['includes']  ?? '');
$is_active        = (int)!!($body['is_active'] ?? true);

if ($slot_label === '' || $departure_time === '' || $price_per_person <= 0) {
    json_error('Slot label, departure time and price are required', 400);
}

$pdo = get_db();

// Helper: confirm an activity belongs to this operator
$ownsActivity = function ($aid) use ($pdo, $op_id) {
    $s = $pdo->prepare('SELECT operator_id FROM water_activities WHERE id = ?');
    $s->execute([$aid]);
    $owner = $s->fetchColumn();
    return $owner !== false && (int)$owner === $op_id;
};

if ($id > 0) {
    // Confirm slot's existing activity is ours
    $s = $pdo->prepare('SELECT activity_id FROM activity_slots WHERE id = ?');
    $s->execute([$id]);
    $current_act = (int)$s->fetchColumn();
    if (!$current_act || !$ownsActivity($current_act)) json_error('Forbidden', 403);

    // If caller is moving the slot to a different activity, that target must also be ours
    if ($activity_id > 0 && $activity_id !== $current_act && !$ownsActivity($activity_id)) {
        json_error('Forbidden: target activity is not yours', 403);
    }
    $final_act = $activity_id > 0 ? $activity_id : $current_act;

    $stmt = $pdo->prepare('UPDATE activity_slots SET activity_id=?, slot_label=?, description=?,
        departure_time=?, duration_min=?, price_per_person=?, max_persons=?, image_url=?, includes=?, is_active=?
        WHERE id=?');
    $stmt->execute([$final_act, $slot_label, $description ?: null, $departure_time, $duration_min,
        $price_per_person, $max_persons, $image_url ?: null, $includes ?: null, $is_active, $id]);
    json_response(['id' => $id, 'updated' => true]);
} else {
    if (!$activity_id || !$ownsActivity($activity_id)) {
        json_error('activity_id is required and must be one of your activities', 400);
    }
    $stmt = $pdo->prepare('INSERT INTO activity_slots
        (activity_id, slot_label, description, departure_time, duration_min, price_per_person, max_persons, image_url, includes, is_active)
        VALUES (?,?,?,?,?,?,?,?,?,?)');
    $stmt->execute([$activity_id, $slot_label, $description ?: null, $departure_time, $duration_min,
        $price_per_person, $max_persons, $image_url ?: null, $includes ?: null, $is_active]);
    json_response(['id' => (int)$pdo->lastInsertId(), 'created' => true], 201);
}
