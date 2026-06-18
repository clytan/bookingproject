<?php
// =============================================================
// Availability engine
//   - room_availability(): max units booked on any night in range
//   - reads PDO via get_db(). Returns [available_units, total_rooms, fully_booked].
//
// Algorithm: fetch all overlapping bookings (status in {pending, confirmed}),
//            then iterate through each night in the requested range and
//            count concurrent bookings. The day with the highest count
//            determines availability for the whole stay.
//
// This is precise for multi-unit room types and correctly handles bookings
// that partially overlap the request window.
// =============================================================

function room_availability(int $room_id, string $checkin, string $checkout): array {
    $pdo = get_db();

    $room = $pdo->prepare('SELECT total_rooms FROM hotel_rooms WHERE id = ? LIMIT 1');
    $room->execute([$room_id]);
    $row = $room->fetch();
    if (!$row) return ['available' => 0, 'total' => 0, 'fully_booked' => true];

    $total = (int)$row['total_rooms'];

    // Fetch active bookings that overlap the requested range.
    // Overlap rule: existing.check_in < requested.check_out AND existing.check_out > requested.check_in
    $stmt = $pdo->prepare(
        'SELECT check_in, check_out FROM hotel_bookings
         WHERE room_id = ?
           AND status IN (\'pending\',\'confirmed\')
           AND check_in  < ?
           AND check_out > ?'
    );
    $stmt->execute([$room_id, $checkout, $checkin]);
    $bookings = $stmt->fetchAll();

    if (!$bookings) {
        return ['available' => $total, 'total' => $total, 'fully_booked' => false];
    }

    // Walk every night in [checkin, checkout) and count concurrent bookings.
    $start = new DateTime($checkin);
    $end   = new DateTime($checkout);
    $maxConcurrent = 0;

    for ($d = clone $start; $d < $end; $d->modify('+1 day')) {
        $count = 0;
        $ts = $d->getTimestamp();
        foreach ($bookings as $b) {
            $bin  = strtotime($b['check_in']);
            $bout = strtotime($b['check_out']);
            if ($ts >= $bin && $ts < $bout) $count++;
        }
        if ($count > $maxConcurrent) $maxConcurrent = $count;
    }

    $available = max(0, $total - $maxConcurrent);
    return [
        'available'     => $available,
        'total'         => $total,
        'fully_booked'  => $available === 0,
    ];
}
