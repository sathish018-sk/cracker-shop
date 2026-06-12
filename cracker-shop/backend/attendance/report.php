<?php
// Monthly Attendance Aggregation Report API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed.", 405);
}

$month = intval($_GET['month'] ?? date('m'));
$year = intval($_GET['year'] ?? date('Y'));

if ($month < 1 || $month > 12 || $year < 2000) {
    sendError("Valid month (1-12) and year parameters are required.");
}

try {
    $sql = "SELECT w.id, w.worker_id as worker_code, w.name, w.role, w.salary_type, w.salary_rate,
                   COALESCE(SUM(CASE WHEN a.status = 'Present' THEN 1.0 ELSE 0.0 END), 0.0) as present_days,
                   COALESCE(SUM(CASE WHEN a.status = 'Absent' THEN 1.0 ELSE 0.0 END), 0.0) as absent_days,
                   COALESCE(SUM(CASE WHEN a.status = 'HalfDay' THEN 0.5 ELSE 0.0 END), 0.0) as half_days,
                   (COALESCE(SUM(CASE WHEN a.status = 'Present' THEN 1.0 ELSE 0.0 END), 0.0) + 
                    COALESCE(SUM(CASE WHEN a.status = 'HalfDay' THEN 0.5 ELSE 0.0 END), 0.0)) as total_worked_days
            FROM workers w
            LEFT JOIN attendance a ON w.id = a.worker_id AND MONTH(a.date) = :month AND YEAR(a.date) = :year
            WHERE w.status = 'Active'
            GROUP BY w.id, w.worker_id, w.name, w.role, w.salary_type, w.salary_rate
            ORDER BY w.worker_id ASC";
            
    $stmt = $conn->prepare($sql);
    $stmt->execute([':month' => $month, ':year' => $year]);
    $report = $stmt->fetchAll();

    sendSuccess("Monthly attendance report retrieved.", [
        "month" => $month,
        "year" => $year,
        "report" => $report
    ]);

} catch (PDOException $e) {
    sendError("Database error: " . $e->getMessage(), 500);
}
