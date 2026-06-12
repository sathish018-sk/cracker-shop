<?php
// Submit Worker Salary Payment API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$user = requireRole(['admin', 'staff']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed. Only POST requests are allowed.", 405);
}

$input = json_decode(file_get_contents("php://input"), true);

$workerId = intval($input['worker_id'] ?? 0);
$month = intval($input['month'] ?? 0);
$year = intval($input['year'] ?? 0);

$presentDays = floatval($input['present_days'] ?? 0.0);
$absentDays = floatval($input['absent_days'] ?? 0.0);

$salaryAmount = floatval($input['salary_amount'] ?? 0.00);
$bonus = floatval($input['bonus'] ?? 0.00);
$deductions = floatval($input['deductions'] ?? 0.00);
$netSalary = floatval($input['net_salary'] ?? 0.00);

$paymentStatus = trim($input['payment_status'] ?? 'Paid');
$transactionId = trim($input['transaction_id'] ?? '');

if ($workerId <= 0 || $month < 1 || $month > 12 || $year < 2000) {
    sendError("Valid Worker ID, Month, and Year are required.");
}

if (!in_array($paymentStatus, ['Paid', 'Pending'])) {
    sendError("Payment status must be 'Paid' or 'Pending'.");
}

try {
    // Check if worker exists
    $wrkStmt = $conn->prepare("SELECT name FROM workers WHERE id = :id LIMIT 1");
    $wrkStmt->execute([':id' => $workerId]);
    $worker = $wrkStmt->fetch();

    if (!$worker) {
        sendError("Worker not found.");
    }

    $workerName = $worker['name'];
    $paymentDate = ($paymentStatus === 'Paid') ? date('Y-m-d H:i:s') : null;

    // Save payment details (Insert or Update if already exists)
    $sql = "INSERT INTO salaries (worker_id, month, year, present_days, absent_days, salary_amount, bonus, deductions, net_salary, payment_status, payment_date, transaction_id) 
            VALUES (:worker_id, :month, :year, :present_days, :absent_days, :salary_amount, :bonus, :deductions, :net_salary, :payment_status, :payment_date, :transaction_id) 
            ON DUPLICATE KEY UPDATE 
                present_days = VALUES(present_days),
                absent_days = VALUES(absent_days),
                salary_amount = VALUES(salary_amount),
                bonus = VALUES(bonus),
                deductions = VALUES(deductions),
                net_salary = VALUES(net_salary),
                payment_status = VALUES(payment_status),
                payment_date = VALUES(payment_date),
                transaction_id = VALUES(transaction_id)";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':worker_id' => $workerId,
        ':month' => $month,
        ':year' => $year,
        ':present_days' => $presentDays,
        ':absent_days' => $absentDays,
        ':salary_amount' => $salaryAmount,
        ':bonus' => $bonus,
        ':deductions' => $deductions,
        ':net_salary' => $netSalary,
        ':payment_status' => $paymentStatus,
        ':payment_date' => $paymentDate,
        ':transaction_id' => !empty($transactionId) ? $transactionId : null
    ]);

    $payoutId = $conn->lastInsertId();

    logActivity($conn, $user['id'], 'PAY_SALARY', "Recorded payment status '$paymentStatus' for worker '$workerName' for period $month/$year. Net Salary: ₹" . number_format($netSalary, 2));

    sendSuccess("Salary payout details saved successfully.", [
        "salary_record_id" => $payoutId,
        "payment_status" => $paymentStatus,
        "net_salary" => $netSalary
    ]);

} catch (PDOException $e) {
    sendError("Database error during salary payment: " . $e->getMessage(), 500);
}
