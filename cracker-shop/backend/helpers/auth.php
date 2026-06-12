<?php
// Authentication Middleware Helper

require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/response.php';

function getBearerToken() {
    $headers = getallheaders();
    
    // Check for Authorization header
    $authHeader = null;
    if (isset($headers['Authorization'])) {
        $authHeader = $headers['Authorization'];
    } elseif (isset($headers['authorization'])) {
        $authHeader = $headers['authorization'];
    }
    
    if (!empty($authHeader)) {
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function requireAuth() {
    $token = getBearerToken();
    if (!$token) {
        sendError("Authentication token is missing.", 401);
    }
    
    $decoded = validateJWT($token);
    if (!$decoded) {
        sendError("Invalid or expired authentication token.", 401);
    }
    
    return $decoded; // Returns user array: ['id' => X, 'username' => Y, 'role' => Z]
}

function requireRole($allowedRoles) {
    $user = requireAuth();
    
    if (is_string($allowedRoles)) {
        $allowedRoles = [$allowedRoles];
    }
    
    if (!in_array($user['role'], $allowedRoles)) {
        sendError("Access Denied: You do not have permission to perform this action.", 403);
    }
    
    return $user;
}

function logActivity($conn, $userId, $action, $details) {
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'Unknown';
        $sql = "INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (:user_id, :action, :details, :ip)";
        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':action' => $action,
            ':details' => $details,
            ':ip' => $ip
        ]);
    } catch (Exception $e) {
        // Silently fail if log cannot be written (or log to system error log)
        error_log("Failed to log activity: " . $e->getMessage());
    }
}
