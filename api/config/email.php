<?php
// =============================================================
// Email OTP sender (PHPMailer + SMTP).
//
// Modes (set MAIL_MODE below):
//   'dev'  -> Don't actually send. Log the OTP to PHP error log AND
//             return it in the API response so the front-end can show
//             "DEV: code is 123456" for testing.
//   'smtp' -> Send via SMTP using PHPMailer. Fill in credentials below.
//
// To use Gmail SMTP:
//   1) Enable 2FA on your Google account
//   2) Create an App Password at https://myaccount.google.com/apppasswords
//   3) Set MAIL_HOST/USER/PASS below and switch MAIL_MODE to 'smtp'.
// =============================================================

require_once __DIR__ . '/../lib/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../lib/PHPMailer/SMTP.php';
require_once __DIR__ . '/../lib/PHPMailer/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

define('MAIL_MODE', 'smtp');    // 'dev' | 'smtp'

// ---- SMTP credentials (only used when MAIL_MODE === 'smtp') ----
// GoDaddy / cPanel mailbox (Secure SSL/TLS, port 465)
define('MAIL_HOST',     'sg2plzcpnl456445.prod.sin2.secureserver.net');
define('MAIL_PORT',     465);                                  // SMTPS (implicit SSL)
define('MAIL_USERNAME', 'support@codersdek.com');
define('MAIL_PASSWORD', 'gjxlsyq33hkfwdfs');
define('MAIL_FROM',     'support@codersdek.com');
define('MAIL_FROM_NAME','COKALO');

define('OTP_LIFETIME',  300);    // 5 minutes
define('OTP_RESEND_COOLDOWN', 60);

function otp_generate_code() {
    return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}

/**
 * Send an OTP code to an email address.
 * Returns ['sent' => bool, 'provider' => string, 'dev_code' => string|null, 'error' => string|null].
 */
function send_otp_email($to, $name, $code) {
    if (MAIL_MODE === 'dev') {
        error_log("[OTP-DEV] to=$to code=$code");
        return ['sent' => true, 'provider' => 'dev', 'dev_code' => $code, 'error' => null];
    }

    if (MAIL_MODE === 'smtp') {
        if (MAIL_USERNAME === '' || MAIL_PASSWORD === '') {
            return ['sent' => false, 'provider' => 'smtp', 'dev_code' => null,
                    'error' => 'SMTP credentials not configured'];
        }
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = MAIL_HOST;
            $mail->Port       = MAIL_PORT;
            $mail->SMTPAuth   = true;
            $mail->Username   = MAIL_USERNAME;
            $mail->Password   = MAIL_PASSWORD;
            // Auto-pick encryption based on port (465 = SMTPS / implicit SSL, 587 = STARTTLS)
            $mail->SMTPSecure = (MAIL_PORT === 465)
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
            $mail->addAddress($to, $name ?: $to);
            $mail->isHTML(true);

            $mail->Subject = "Your COKALO verification code: $code";
            $mail->Body    = otp_email_body($code, $name);
            $mail->AltBody = "Your COKALO verification code is $code. Valid for 5 minutes. Don't share this with anyone.";

            $mail->send();
            return ['sent' => true, 'provider' => 'smtp', 'dev_code' => null, 'error' => null];
        } catch (PHPMailerException $e) {
            return ['sent' => false, 'provider' => 'smtp', 'dev_code' => null,
                    'error' => 'Mail error: ' . $mail->ErrorInfo];
        }
    }

    return ['sent' => false, 'provider' => MAIL_MODE, 'dev_code' => null,
            'error' => 'Unknown MAIL_MODE: ' . MAIL_MODE];
}

/**
 * Send a hotel booking confirmation email.
 * `$booking` is an associative array with: booking_code, hotel_name, room_type,
 * check_in, check_out, nights, guests, total_amount, status, address (optional).
 * Returns the same shape as send_otp_email().
 */
function send_booking_confirmation_email($to, $name, $booking) {
    if (MAIL_MODE === 'dev') {
        error_log("[BOOKING-DEV] to=$to code={$booking['booking_code']}");
        return ['sent' => true, 'provider' => 'dev', 'error' => null];
    }

    if (MAIL_MODE === 'smtp') {
        if (MAIL_USERNAME === '' || MAIL_PASSWORD === '') {
            return ['sent' => false, 'provider' => 'smtp', 'error' => 'SMTP credentials not configured'];
        }
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = MAIL_HOST;
            $mail->Port       = MAIL_PORT;
            $mail->SMTPAuth   = true;
            $mail->Username   = MAIL_USERNAME;
            $mail->Password   = MAIL_PASSWORD;
            $mail->SMTPSecure = (MAIL_PORT === 465)
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
            $mail->addAddress($to, $name ?: $to);
            $mail->isHTML(true);

            $mail->Subject = 'Your COKALO booking is confirmed — ' . $booking['booking_code'];
            $mail->Body    = booking_email_body($booking, $name);
            $mail->AltBody = "Your COKALO booking {$booking['booking_code']} for {$booking['hotel_name']} ({$booking['check_in']} to {$booking['check_out']}) is confirmed. Total INR " . number_format((float)$booking['total_amount'], 0) . ".";

            $mail->send();
            return ['sent' => true, 'provider' => 'smtp', 'error' => null];
        } catch (PHPMailerException $e) {
            return ['sent' => false, 'provider' => 'smtp', 'error' => 'Mail error: ' . $mail->ErrorInfo];
        }
    }

    return ['sent' => false, 'provider' => MAIL_MODE, 'error' => 'Unknown MAIL_MODE: ' . MAIL_MODE];
}

/**
 * Send a water-activity booking confirmation email.
 * `$booking` keys: booking_code, activity_name, slot_label, activity_date,
 * departure_time, persons, total_amount, city, operator_name (optional).
 * For multi-item bookings, pass `lines` (array of those keys) and `booking_code`,
 * `total_amount`; the template will iterate.
 */
function send_activity_confirmation_email($to, $name, $booking) {
    if (MAIL_MODE === 'dev') {
        error_log("[ACTIVITY-BOOKING-DEV] to=$to code={$booking['booking_code']}");
        return ['sent' => true, 'provider' => 'dev', 'error' => null];
    }

    if (MAIL_MODE === 'smtp') {
        if (MAIL_USERNAME === '' || MAIL_PASSWORD === '') {
            return ['sent' => false, 'provider' => 'smtp', 'error' => 'SMTP credentials not configured'];
        }
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = MAIL_HOST;
            $mail->Port       = MAIL_PORT;
            $mail->SMTPAuth   = true;
            $mail->Username   = MAIL_USERNAME;
            $mail->Password   = MAIL_PASSWORD;
            $mail->SMTPSecure = (MAIL_PORT === 465)
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom(MAIL_FROM, MAIL_FROM_NAME);
            $mail->addAddress($to, $name ?: $to);
            $mail->isHTML(true);

            $mail->Subject = 'Your COKALO booking is confirmed — ' . $booking['booking_code'];
            $mail->Body    = activity_email_body($booking, $name);
            $totalLine = 'INR ' . number_format((float)$booking['total_amount'], 0);
            $mail->AltBody = "Your COKALO booking {$booking['booking_code']} is confirmed. Total $totalLine.";

            $mail->send();
            return ['sent' => true, 'provider' => 'smtp', 'error' => null];
        } catch (PHPMailerException $e) {
            return ['sent' => false, 'provider' => 'smtp', 'error' => 'Mail error: ' . $mail->ErrorInfo];
        }
    }

    return ['sent' => false, 'provider' => MAIL_MODE, 'error' => 'Unknown MAIL_MODE: ' . MAIL_MODE];
}

function activity_email_body($b, $name) {
    $greet  = $name ? 'Hi ' . htmlspecialchars($name) . ',' : 'Hi there,';
    $code   = htmlspecialchars($b['booking_code']);
    $total  = 'INR ' . number_format((float)$b['total_amount'], 0);

    // Build rows — either a single activity or multiple "lines"
    $lines = isset($b['lines']) && is_array($b['lines']) ? $b['lines'] : [[
        'activity_name'  => $b['activity_name'] ?? '',
        'slot_label'     => $b['slot_label']    ?? '',
        'activity_date'  => $b['activity_date'] ?? '',
        'departure_time' => $b['departure_time']?? '',
        'persons'        => $b['persons']       ?? 1,
        'city'           => $b['city']          ?? '',
    ]];

    $rowsHtml = '';
    foreach ($lines as $L) {
        $aname = htmlspecialchars($L['activity_name'] ?? '');
        $city  = htmlspecialchars($L['city']  ?? '');
        $slot  = htmlspecialchars($L['slot_label'] ?? '');
        $date  = htmlspecialchars($L['activity_date'] ?? '');
        $dep   = htmlspecialchars(substr($L['departure_time'] ?? '', 0, 5));
        $pers  = (int)($L['persons'] ?? 1);
        $cityLine = $city ? "<div style=\"color:#64748B;font-size:13px;margin-top:2px;\">$city</div>" : '';
        $rowsHtml .= <<<ROW
        <tr>
          <td colspan="2" style="padding:14px 0; border-bottom:1px solid #F1EDF8;">
            <div style="font-weight:600;font-size:14px;color:#0F0B1F;">$aname</div>
            $cityLine
            <div style="margin-top:6px;font-size:13px;color:#475569;">$slot · $date · departs $dep · $pers person(s)</div>
          </td>
        </tr>
ROW;
    }

    return <<<HTML
<!DOCTYPE html>
<html><body style="font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; background:#FBFAFD; padding:32px 0; margin:0;">
  <table cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="background:white;border:1px solid #E9E5F2;border-radius:18px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#6D28D9,#1E40AF); padding:28px 32px; color:white;">
      <div style="font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; opacity:.85;">COKALO · Booking confirmed</div>
      <div style="font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:26px; font-weight:700; margin-top:8px;">You're all set, $greet</div>
    </td></tr>

    <tr><td style="padding:28px 32px 8px;">
      <p style="margin:0 0 16px; color:#0F0B1F; font-size:15px; line-height:1.6;">
        Your water-sport reservation is confirmed. Show this email (or your booking code) at the dock.
      </p>

      <div style="background:#F5F2FB; border:1px solid #E9E5F2; border-radius:14px; padding:18px 20px; margin:8px 0 18px;">
        <div style="font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#64748B;">Booking code</div>
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace; font-size:20px; font-weight:700; color:#4C1D95; margin-top:4px; letter-spacing:1px;">$code</div>
      </div>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px; color:#0F0B1F;">
        $rowsHtml
        <tr>
          <td style="padding:14px 0 4px; color:#64748B; width:140px;">Total paid</td>
          <td style="padding:14px 0 4px; font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:20px; font-weight:700; color:#4C1D95;">$total</td>
        </tr>
      </table>

      <p style="margin:22px 0 0; color:#64748B; font-size:13px; line-height:1.6;">
        Need to cancel or modify? Head to "My Bookings" in your COKALO account.
      </p>
    </td></tr>

    <tr><td style="background:#F5F2FB; padding:16px 32px; text-align:center; color:#64748B; font-size:12px;">
      © COKALO · Explore. Discover. Celebrate.
    </td></tr>
  </table>
</body></html>
HTML;
}

function booking_email_body($b, $name) {
    $greet  = $name ? 'Hi ' . htmlspecialchars($name) . ',' : 'Hi there,';
    $code   = htmlspecialchars($b['booking_code']);
    $hotel  = htmlspecialchars($b['hotel_name'] ?? '');
    $room   = htmlspecialchars($b['room_type']  ?? '');
    $addr   = htmlspecialchars($b['address']    ?? '');
    $cin    = htmlspecialchars($b['check_in']);
    $cout   = htmlspecialchars($b['check_out']);
    $nights = (int)$b['nights'];
    $guests = (int)$b['guests'];
    $total  = 'INR ' . number_format((float)$b['total_amount'], 0);
    $addrRow = $addr === '' ? '' : "<div style=\"margin-top:6px;color:#64748B;font-size:13px;\">$addr</div>";

    return <<<HTML
<!DOCTYPE html>
<html><body style="font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; background:#FBFAFD; padding:32px 0; margin:0;">
  <table cellpadding="0" cellspacing="0" border="0" align="center" width="560" style="background:white;border:1px solid #E9E5F2;border-radius:18px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#6D28D9,#1E40AF); padding:28px 32px; color:white;">
      <div style="font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; opacity:.85;">COKALO · Booking confirmed</div>
      <div style="font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:26px; font-weight:700; margin-top:8px;">You're all set, $greet</div>
    </td></tr>

    <tr><td style="padding:28px 32px 8px;">
      <p style="margin:0 0 16px; color:#0F0B1F; font-size:15px; line-height:1.6;">
        Your reservation has been confirmed. Below are your booking details — keep this email for your records.
      </p>

      <div style="background:#F5F2FB; border:1px solid #E9E5F2; border-radius:14px; padding:18px 20px; margin:8px 0 18px;">
        <div style="font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#64748B;">Booking code</div>
        <div style="font-family:'SF Mono',Menlo,Consolas,monospace; font-size:20px; font-weight:700; color:#4C1D95; margin-top:4px; letter-spacing:1px;">$code</div>
      </div>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px; color:#0F0B1F;">
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; color:#64748B; width:140px;">Property</td>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; font-weight:600;">$hotel$addrRow</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; color:#64748B;">Room type</td>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; font-weight:600;">$room</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; color:#64748B;">Check-in</td>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; font-weight:600;">$cin</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; color:#64748B;">Check-out</td>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; font-weight:600;">$cout</td>
        </tr>
        <tr>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; color:#64748B;">Nights · Guests</td>
          <td style="padding:10px 0; border-bottom:1px solid #F1EDF8; font-weight:600;">$nights night(s) · $guests guest(s)</td>
        </tr>
        <tr>
          <td style="padding:14px 0 4px; color:#64748B;">Total paid</td>
          <td style="padding:14px 0 4px; font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:20px; font-weight:700; color:#4C1D95;">$total</td>
        </tr>
      </table>

      <p style="margin:22px 0 0; color:#64748B; font-size:13px; line-height:1.6;">
        Please show this email (or your booking code) at check-in. If you need to cancel
        or modify your stay, head to "My Bookings" in your COKALO account.
      </p>
    </td></tr>

    <tr><td style="background:#F5F2FB; padding:16px 32px; text-align:center; color:#64748B; font-size:12px;">
      © COKALO · Explore. Discover. Celebrate.
    </td></tr>
  </table>
</body></html>
HTML;
}

function otp_email_body($code, $name) {
    $greet = $name ? "Hi " . htmlspecialchars($name) . "," : "Hi there,";
    return <<<HTML
<!DOCTYPE html>
<html><body style="font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; background:#FBFAFD; padding:32px 0; margin:0;">
  <table cellpadding="0" cellspacing="0" border="0" align="center" width="540" style="background:white;border:1px solid #E9E5F2;border-radius:18px;overflow:hidden;">
    <tr><td style="background:linear-gradient(135deg,#6D28D9,#1E40AF); padding:28px 32px; color:white;">
      <div style="font-size:11px; font-weight:700; letter-spacing:.18em; text-transform:uppercase; opacity:.85;">COKALO · Verification</div>
      <div style="font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:26px; font-weight:700; margin-top:8px;">Your sign-in code</div>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="margin:0 0 14px; color:#0F0B1F; font-size:15px;">$greet</p>
      <p style="margin:0 0 18px; color:#64748B; font-size:14px; line-height:1.6;">
        Use the following code to confirm your email and continue signing in. It expires in 5 minutes.
      </p>
      <div style="text-align:center; padding:20px 0;">
        <div style="display:inline-block; font-family:'Aptos Narrow','Aptos',Inter,Segoe UI,Roboto,Arial,sans-serif; font-size:34px; font-weight:700; letter-spacing:8px; color:#4C1D95; background:#F3E8FF; padding:14px 28px; border-radius:14px;">
          $code
        </div>
      </div>
      <p style="margin:0; color:#94A3B8; font-size:12px; line-height:1.6;">
        Didn't request this? You can safely ignore the email — your account stays untouched.
        Never share this code with anyone, including COKALO staff.
      </p>
    </td></tr>
    <tr><td style="background:#F5F2FB; padding:16px 32px; text-align:center; color:#64748B; font-size:12px;">
      © COKALO · Explore. Discover. Celebrate.
    </td></tr>
  </table>
</body></html>
HTML;
}
