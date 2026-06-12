<?php
// Salary Payout Report API

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
    $sql = "SELECT s.*, w.worker_id as worker_code, w.name, w.role, w.salary_type, w.salary_rate
            FROM salaries s
            LEFT JOIN workers w ON s.worker_id = w.id
            WHERE s.month = :month AND s.year = :year
            ORDER BY w.worker_id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':month' => $month, ':year' => $year]);
    $records = $stmt->fetchAll();

    // Calculate totals for summary metrics
    $totalPaid = 0.00;
    $totalPending = 0.00;
    foreach ($records as $record) {
        $net = floatval($record['net_salary']);
        if ($record['payment_status'] === 'Paid') {
            $totalPaid += $net;
        } else {
            $totalPending += $net;
        }
    }

    sendSuccess("Salary reports retrieved.", [
        "month" => $month,
        "year" => $year,
        "summary" => [
            "total_paid" => $totalPaid,
            "total_pending" => $totalPending,
            "total_expenditure" => $totalPaid + $totalPending
        ],
        "records" => $records
    ]);

} catch (PDOException $e) {
    sendError("Database error during salary report retrieval: " . $e->getMessage(), 500);
}
