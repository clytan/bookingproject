<?php
require_once __DIR__ . '/helpers.php';
cors_headers();

json_response([
    'name'    => 'COKALO API',
    'version' => '0.1.0',
    'endpoints' => [
        'POST /api/admin/login.php'             => 'Admin login (returns JWT)',
        'GET  /api/admin/me.php'                => 'Current admin (Bearer)',
        'POST /api/users/register.php'          => 'Register a passenger',
        'POST /api/users/login.php'             => 'User login (returns JWT)',
        'GET  /api/users/me.php'                => 'Current user (Bearer)',
        'GET  /api/hotels/list.php'             => 'All hotels (?city= optional)',
        'GET  /api/hotels/search.php'           => 'Search hotels (?city, checkin, checkout, guests)',
        'GET  /api/hotels/get.php?id='          => 'Hotel detail with rooms',
        'POST /api/hotels/book.php'             => 'Create hotel booking (user Bearer)',
        'GET  /api/admin/hotels/list.php'       => 'Admin: all hotels with stats',
        'GET  /api/admin/hotel-bookings/list.php' => 'Admin: all hotel bookings',
        'POST /api/manager/login.php'           => 'Hotel manager login',
        'GET  /api/manager/me.php'              => 'Current manager (Bearer)',
        'GET  /api/manager/stats.php'           => 'Dashboard stats for manager hotel',
        'GET  /api/manager/rooms/list.php'      => 'Rooms of manager hotel',
        'POST /api/manager/rooms/save.php'      => 'Create or update room',
        'POST /api/manager/rooms/delete.php'    => 'Delete room',
        'GET  /api/manager/bookings/list.php'   => 'Bookings of manager hotel',
        'POST /api/manager/bookings/create.php' => 'Create walk-in booking',
        'POST /api/manager/bookings/status.php' => 'Update booking status',
        'GET  /api/hotels/availability.php'     => 'Room availability for date range',
    ],
]);
