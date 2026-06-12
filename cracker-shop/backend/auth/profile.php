<?php
// User Profile API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

// Validates authentication and retrieves token payload
$currentUser = requireAuth();

try {
    $sql = "SELECT id, username, role, name, email, status, last_login, current_login, created_at FROM users WHERE id = :id LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':id' => $currentUser['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        sendError("User not found.", 404);
    }

    sendSuccess("Profile retrieved successfully.", ["user" => $user]);

} catch (PDOException $e) {
    sendError("Database error: " . $e->getMessage(), 500);
}
