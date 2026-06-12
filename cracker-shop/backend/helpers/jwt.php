<?php
// Standalone JWT Helper (HMAC-SHA256)

define('JWT_SECRET_KEY', 'SM_CRACKERS_SUPER_SECURE_JWT_SECRET_KEY_2026!');

function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function base64UrlDecode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $data .= str_repeat('=', $padlen);
    }
    return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
}

function generateJWT($payload, $expiry_seconds = 86400) {
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    
    // Add time claims
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiry_seconds;
    $payload_str = json_encode($payload);
    
    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payload_str);
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET_KEY, true);
    $base64UrlSignature = base64UrlEncode($signature);
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function validateJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
    
    // Re-verify signature
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET_KEY, true);
    $expectedSignature = base64UrlEncode($signature);
    
    if (!hash_equals($expectedSignature, $base64UrlSignature)) {
        return false;
    }
    
    $payload = json_decode(base64UrlDecode($base64UrlPayload), true);
    
    // Check expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}
