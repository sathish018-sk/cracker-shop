<?php
// Retrieve Attendance for a Date API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed.", 405);
}

$date = trim($_GET['date'] ?? date('Y-m-d'));

if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    sendError("Invalid date format. Use YYYY-MM-DD.");
}

try {
    // Get all active workers and join with attendance for the specific date
    $sql = "SELECT w.id as worker_id, w.worker_id as worker_code, w.name, w.role, w.salary_type, w.salary_rate, a.status 
            FROM workers w 
            LEFT JOIN attendance a ON w.id = a.worker_id AND a.date = :date 
            WHERE w.status = 'Active' 
            ORDER BY w.worker_id ASC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([':date' => $date]);
    $records = $stmt->fetchAll();

    sendSuccess("Attendance records for $date retrieved.", [
        "date" => $date,
        "records" => $records
    ]);

} catch (PDOException $e) {
    sendError("Database error: " . $e->getMessage(), 500);
}
