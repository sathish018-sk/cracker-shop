<?php
// System Activity Logs API (Admin Only)

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

// Require Admin role
requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed. Only GET requests are allowed.", 405);
}

try {
    // Fetch last 100 logs with user details
    $sql = "SELECT l.*, u.name as user_name, u.role as user_role 
            FROM activity_logs l 
            LEFT JOIN users u ON l.user_id = u.id 
            ORDER BY l.created_at DESC 
            LIMIT 100";
    
    $stmt = $conn->query($sql);
    $logs = $stmt->fetchAll();

    sendSuccess("System activity logs retrieved.", ["logs" => $logs]);

} catch (PDOException $e) {
    sendError("Database error during logs retrieval: " . $e->getMessage(), 500);
}
