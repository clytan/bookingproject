<?php
// Multi-booking. Accepts an array of items: { slot_id, date, persons }.
// All inserted in one transaction; if any single item fails availability, rolls back the whole cart.
require_once __DIR__ . '/../helpers.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/jwt.php';
require_once __DIR__ . '/../config/email.php';

cors_headers();
require_method('POST');

$payload = require_user_auth();
$user_id = (int)$payload['sub'];

$body  = read_json_body();
$items = $body['items'] ?? [];

if (!is_array($items) || count($items) === 0) {
    json_error('items array is required', 400);
}
if (count($items) > 20) {
    json_error('Maximum 20 items per checkout', 400);
}

$today = new DateTime('today');
$pdo   = get_db();
$pdo->beginTransaction();

try {
    $created = [];

    foreach ($items as $idx => $item) {
        $slot_id = (int)($item['slot_id'] ?? 0);
        $date    = trim($item['date']    ?? '');
        $persons = max(1, (int)($item['persons'] ?? 1));

        if ($slot_id <= 0 || $date === '') {
            throw new RuntimeException("Item #" . ($idx + 1) . ": slot_id and date are required");
        }
        $when = new DateTime($date);
        if ($when < $today) {
            throw new RuntimeException("Item #" . ($idx + 1) . ": date cannot be in the past");
        }

        // Lock-friendly fetch of the slot + activity
        $stmt = $pdo->prepare('SELECT s.*, a.name AS activity_name, a.city
                               FROM activity_slots s
                               JOIN water_activities a ON a.id = s.activity_id
                               WHERE s.id = ? AND s.is_active = 1 LIMIT 1
                               FOR UPDATE');
        $stmt->execute([$slot_id]);
        $slot = $stmt->fetch();
        if (!$slot) throw new RuntimeException("Slot #$slot_id not found");

        // Availability check (counts pending+confirmed for that date/slot)
        $used = $pdo->prepare(
            'SELECT COALESCE(SUM(persons), 0) FROM activity_bookings
              WHERE slot_id = ? AND activity_date = ? AND status IN (\'pending\',\'confirmed\')'
        );
        $used->execute([$slot_id, $date]);
        $booked = (int)$used->fetchColumn();
        $free   = (int)$slot['max_persons'] - $booked;
        if ($persons > $free) {
            throw new RuntimeException("\"" . $slot['activity_name'] . "\" — only $free place(s) left for $date");
        }

        $total = (float)$slot['price_per_person'] * $persons;
        $code  = 'WA' . strtoupper(bin2hex(random_bytes(4)));

        $insert = $pdo->prepare('INSERT INTO activity_bookings
            (booking_code, user_id, activity_id, slot_id, activity_date, persons, total_amount, status, booking_source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([
            $code, $user_id, (int)$slot['activity_id'], $slot_id,
            $date, $persons, $total, 'confirmed', 'user',
        ]);

        $created[] = [
            'id'             => (int)$pdo->lastInsertId(),
            'booking_code'   => $code,
            'activity'       => $slot['activity_name'],
            'city'           => $slot['city'],
            'slot_label'     => $slot['slot_label'],
            'departure_time' => $slot['departure_time'],
            'date'           => $date,
            'persons'        => $persons,
            'total_amount'   => $total,
            'status'         => 'confirmed',
        ];
    }

    $pdo->commit();
    $grand_total = array_sum(array_column($created, 'total_amount'));

    // One consolidated email per cart checkout
    $email_sent = false;
    $u = $pdo->prepare('SELECT name, email FROM users WHERE id = ? LIMIT 1');
    $u->execute([$user_id]);
    $guest = $u->fetch();
    if ($guest && $guest['email']) {
        $lines = array_map(function ($c) {
            return [
                'activity_name'  => $c['activity'],
                'city'           => $c['city'],
                'slot_label'     => $c['slot_label'],
                'activity_date'  => $c['date'],
                'departure_time' => $c['departure_time'],
                'persons'        => $c['persons'],
            ];
        }, $created);
        $r = send_activity_confirmation_email($guest['email'], $guest['name'], [
            'booking_code' => $created[0]['booking_code'] . (count($created) > 1 ? ' (+' . (count($created) - 1) . ' more)' : ''),
            'lines'        => $lines,
            'total_amount' => $grand_total,
        ]);
        $email_sent = $r['sent'];
        if (!$r['sent']) error_log("[ACTIVITY-EMAIL] cart failed: " . ($r['error'] ?? 'unknown'));
    }

    json_response([
        'bookings'    => $created,
        'count'       => count($created),
        'grand_total' => $grand_total,
        'email_sent'  => $email_sent,
    ], 201);

} catch (RuntimeException $e) {
    $pdo->rollBack();
    json_error($e->getMessage(), 409);
} catch (Throwable $e) {
    $pdo->rollBack();
    json_error('Booking failed: ' . $e->getMessage(), 500);
}
