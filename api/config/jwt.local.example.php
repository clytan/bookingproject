<?php
// Copy to jwt.local.php and replace with a long random string.
// Generate one with:  php -r "echo bin2hex(random_bytes(48));"
define('JWT_SECRET', 'replace-with-a-long-random-string');
