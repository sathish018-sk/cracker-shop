<?php
// Calculate Worker Salaries API

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
    // Get total days in the selected month
    $daysInMonth = date('t', strtotime("$year-$month-01"));

    // 1. Fetch worker attendance summary for the period
    $sql = "SELECT w.id as worker_id, w.worker_id as worker_code, w.name, w.role, w.salary_type, w.salary_rate,
                   COALESCE(SUM(CASE WHEN a.status = 'Present' THEN 1.0 ELSE 0.0 END), 0.0) as present_days,
                   COALESCE(SUM(CASE WHEN a.status = 'Absent' THEN 1.0 ELSE 0.0 END), 0.0) as absent_days,
                   COALESCE(SUM(CASE WHEN a.status = 'HalfDay' THEN 1.0 ELSE 0.0 END), 0.0) as half_days,
                   (COALESCE(SUM(CASE WHEN a.status = 'Present' THEN 1.0 ELSE 0.0 END), 0.0) + 
                    COALESCE(SUM(CASE WHEN a.status = 'HalfDay' THEN 0.5 ELSE 0.0 END), 0.0)) as total_worked_days
            FROM workers w
            LEFT JOIN attendance a ON w.id = a.worker_id AND MONTH(a.date) = :month AND YEAR(a.date) = :year
            WHERE w.status = 'Active'
            GROUP BY w.id, w.worker_id, w.name, w.role, w.salary_type, w.salary_rate
            ORDER BY w.worker_id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([':month' => $month, ':year' => $year]);
    $attendanceSummaries = $stmt->fetchAll();

    // 2. Fetch already recorded payments for this period
    $paidSql = "SELECT worker_id, id as salary_record_id, present_days, absent_days, salary_amount, bonus, deductions, net_salary, payment_status, payment_date, transaction_id 
                FROM salaries 
                WHERE month = :month AND year = :year";
    $paidStmt = $conn->prepare($paidSql);
    $paidStmt->execute([':month' => $month, ':year' => $year]);
    $existingPayments = $paidStmt->fetchAll(PDO::FETCH_UNIQUE); // array keyed by worker_id

    // 3. Process calculations
    $payroll = [];

    foreach ($attendanceSummaries as $summary) {
        $workerId = $summary['worker_id'];
        $salaryType = $summary['salary_type'];
        $salaryRate = floatval($summary['salary_rate']);
        
        $present = floatval($summary['present_days']);
        $absent = floatval($summary['absent_days']);
        $halfDays = floatval($summary['half_days']);
        
        // Worked days metric
        $workedDays = $present + ($halfDays * 0.5);

        // Payroll math
        $calculatedSalary = 0.00;
        if ($salaryType === 'Daily') {
            // Daily wage: Rate * Worked Days
            $calculatedSalary = $workedDays * $salaryRate;
        } else {
            // Monthly wage: Deduct for absent/half days based on daily rate in that month
            // If they worked 0 days, they get 0
            if ($workedDays > 0) {
                $dailyRate = $salaryRate / floatval($daysInMonth);
                $daysToDeduct = $absent + ($halfDays * 0.5);
                $calculatedSalary = max(0.00, $salaryRate - ($daysToDeduct * $dailyRate));
            } else {
                $calculatedSalary = 0.00;
            }
        }

        $calculatedSalary = round($calculatedSalary, 2);

        // Merge with payment record if exists
        $isPaid = false;
        $bonus = 0.00;
        $deductions = 0.00;
        $netSalary = $calculatedSalary;
        $paymentDate = null;
        $transactionId = '';
        $salaryRecordId = null;

        if (isset($existingPayments[$workerId])) {
            $record = $existingPayments[$workerId];
            $isPaid = ($record['payment_status'] === 'Paid');
            $bonus = floatval($record['bonus']);
            $deductions = floatval($record['deductions']);
            $netSalary = floatval($record['net_salary']);
            $paymentDate = $record['payment_date'];
            $transactionId = $record['transaction_id'] ?? '';
            $salaryRecordId = $record['salary_record_id'];
            
            // If already locked/paid, we use the recorded base salary amount
            $calculatedSalary = floatval($record['salary_amount']);
        }

        $payroll[] = [
            "worker_id" => $workerId,
            "worker_code" => $summary['worker_code'],
            "name" => $summary['name'],
            "role" => $summary['role'],
            "salary_type" => $salaryType,
            "salary_rate" => $salaryRate,
            "present_days" => $present,
            "absent_days" => $absent,
            "half_days" => $halfDays,
            "worked_days" => $workedDays,
            "calculated_salary" => $calculatedSalary,
            "bonus" => $bonus,
            "deductions" => $deductions,
            "net_salary" => $netSalary,
            "payment_status" => $isPaid ? "Paid" : "Pending",
            "payment_date" => $paymentDate,
            "transaction_id" => $transactionId,
            "salary_record_id" => $salaryRecordId
        ];
    }

    sendSuccess("Salary payroll calculations retrieved.", [
        "month" => $month,
        "year" => $year,
        "days_in_month" => $daysInMonth,
        "payroll" => $payroll
    ]);

} catch (PDOException $e) {
    sendError("Database error during salary calculation: " . $e->getMessage(), 500);
}
