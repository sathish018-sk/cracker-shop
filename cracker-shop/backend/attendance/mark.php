<?php
// Mark Daily Attendance API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$user = requireRole(['admin', 'staff']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed. Only POST requests are allowed.", 405);
}

$input = json_decode(file_get_contents("php://input"), true);
$date = trim($input['date'] ?? date('Y-m-d'));
$records = $input['records'] ?? []; // Array of ['worker_id' => X, 'status' => 'Present'|'Absent'|'HalfDay']

if (empty($records)) {
    sendError("No attendance records provided.");
}

// Validate date format
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    sendError("Invalid date format. Use YYYY-MM-DD.");
}

try {
    $conn->beginTransaction();

    $sql = "INSERT INTO attendance (worker_id, date, status) 
            VALUES (:worker_id, :date, :status) 
            ON DUPLICATE KEY UPDATE status = VALUES(status)";
    $stmt = $conn->prepare($sql);

    $markedCount = 0;
    foreach ($records as $record) {
        $workerId = intval($record['worker_id']);
        $status = trim($record['status']);

        if ($workerId <= 0 || !in_array($status, ['Present', 'Absent', 'HalfDay'])) {
            $conn->rollBack();
            sendError("Invalid worker ID or attendance status in records.");
        }

        $stmt->execute([
            ':worker_id' => $workerId,
            ':date' => $date,
            ':status' => $status
        ]);
        $markedCount++;
    }

    logActivity($conn, $user['id'], 'MARK_ATTENDANCE', "Marked attendance for $markedCount workers on $date.");

    $conn->commit();
    sendSuccess("Attendance marked successfully for $date.", ["marked_count" => $markedCount]);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    sendError("Failed to save attendance: " . $e->getMessage(), 500);
}
