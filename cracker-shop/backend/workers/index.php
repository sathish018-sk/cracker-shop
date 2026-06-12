<?php
// Workers CRUD API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();

switch ($method) {
    case 'GET':
        try {
            $search = trim($_GET['search'] ?? '');
            $status = trim($_GET['status'] ?? '');
            
            $query = "SELECT * FROM workers WHERE 1=1";
            $params = [];

            if (!empty($search)) {
                $query .= " AND (name LIKE :search_name OR worker_id LIKE :search_code OR phone LIKE :search_phone)";
                $params[':search_name'] = "%$search%";
                $params[':search_code'] = "%$search%";
                $params[':search_phone'] = "%$search%";
            }

            if (!empty($status)) {
                $query .= " AND status = :status";
                $params[':status'] = $status;
            }

            $query .= " ORDER BY worker_id ASC";
            
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            $workers = $stmt->fetchAll();
            
            sendSuccess("Workers roster retrieved successfully.", ["workers" => $workers]);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        $user = requireRole(['admin', 'staff']);
        $input = json_decode(file_get_contents("php://input"), true);
        
        $workerId = trim($input['worker_id'] ?? '');
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $role = trim($input['role'] ?? '');
        $salaryType = trim($input['salary_type'] ?? 'Daily');
        $salaryRate = floatval($input['salary_rate'] ?? 0.00);
        $aadhaar = trim($input['aadhaar'] ?? '');
        $imageUrl = trim($input['image_url'] ?? '');

        if (empty($workerId) || empty($name) || empty($phone) || empty($role) || empty($aadhaar)) {
            sendError("Worker ID, Name, Phone, Role, and Aadhaar card number are required.");
        }

        if (!in_array($salaryType, ['Daily', 'Monthly'])) {
            sendError("Salary type must be 'Daily' or 'Monthly'.");
        }

        try {
            // Check for duplicate worker ID code
            $chkCode = $conn->prepare("SELECT id FROM workers WHERE worker_id = :worker_id LIMIT 1");
            $chkCode->execute([':worker_id' => $workerId]);
            if ($chkCode->rowCount() > 0) {
                sendError("Worker ID code already exists in roster.");
            }

            // Insert worker
            $sql = "INSERT INTO workers (worker_id, name, phone, role, salary_type, salary_rate, aadhaar, image_url) 
                    VALUES (:worker_id, :name, :phone, :role, :salary_type, :salary_rate, :aadhaar, :image_url)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':worker_id' => $workerId,
                ':name' => $name,
                ':phone' => $phone,
                ':role' => $role,
                ':salary_type' => $salaryType,
                ':salary_rate' => $salaryRate,
                ':aadhaar' => $aadhaar,
                ':image_url' => $imageUrl
            ]);
            $newId = $conn->lastInsertId();

            logActivity($conn, $user['id'], 'CREATE_WORKER', "Added worker '$name' (ID: $workerId) to the roster.");
            sendSuccess("Worker added successfully.", ["id" => $newId], 201);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        $user = requireRole(['admin', 'staff']);
        $input = json_decode(file_get_contents("php://input"), true);
        
        $id = intval($input['id'] ?? 0);
        $workerId = trim($input['worker_id'] ?? '');
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $role = trim($input['role'] ?? '');
        $salaryType = trim($input['salary_type'] ?? 'Daily');
        $salaryRate = floatval($input['salary_rate'] ?? 0.00);
        $aadhaar = trim($input['aadhaar'] ?? '');
        $imageUrl = trim($input['image_url'] ?? '');
        $status = trim($input['status'] ?? 'Active');

        if ($id <= 0 || empty($workerId) || empty($name) || empty($phone) || empty($role) || empty($aadhaar)) {
            sendError("Worker ID, Name, Phone, Role, and Aadhaar card number are required.");
        }

        if (!in_array($salaryType, ['Daily', 'Monthly'])) {
            sendError("Salary type must be 'Daily' or 'Monthly'.");
        }

        if (!in_array($status, ['Active', 'Inactive'])) {
            sendError("Status must be 'Active' or 'Inactive'.");
        }

        try {
            // Check if worker exists
            $chkExist = $conn->prepare("SELECT id FROM workers WHERE id = :id");
            $chkExist->execute([':id' => $id]);
            if ($chkExist->rowCount() === 0) {
                sendError("Worker not found.");
            }

            // Check duplicate worker ID for others
            $chkCode = $conn->prepare("SELECT id FROM workers WHERE worker_id = :worker_id AND id != :id LIMIT 1");
            $chkCode->execute([':worker_id' => $workerId, ':id' => $id]);
            if ($chkCode->rowCount() > 0) {
                sendError("Another worker already has this Worker ID code.");
            }

            // Update worker
            $sql = "UPDATE workers 
                    SET worker_id = :worker_id, name = :name, phone = :phone, role = :role, 
                        salary_type = :salary_type, salary_rate = :salary_rate, aadhaar = :aadhaar, 
                        image_url = :image_url, status = :status 
                    WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':worker_id' => $workerId,
                ':name' => $name,
                ':phone' => $phone,
                ':role' => $role,
                ':salary_type' => $salaryType,
                ':salary_rate' => $salaryRate,
                ':aadhaar' => $aadhaar,
                ':image_url' => $imageUrl,
                ':status' => $status,
                ':id' => $id
            ]);

            logActivity($conn, $user['id'], 'UPDATE_WORKER', "Updated details for worker '$name' (ID: $workerId).");
            sendSuccess("Worker details updated successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        // Only Admin can delete worker records
        $user = requireRole('admin');
        $id = intval($_GET['id'] ?? 0);

        if ($id <= 0) {
            sendError("Valid Worker ID is required as a query parameter.");
        }

        try {
            $stmt = $conn->prepare("SELECT name, worker_id, image_url FROM workers WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $worker = $stmt->fetch();

            if (!$worker) {
                sendError("Worker not found.");
            }

            // Delete worker (Attendance and Salaries will Cascade delete due to DB constraints)
            $delStmt = $conn->prepare("DELETE FROM workers WHERE id = :id");
            $delStmt->execute([':id' => $id]);

            // Try to delete image if exists
            if (!empty($worker['image_url']) && file_exists(__DIR__ . '/../' . $worker['image_url'])) {
                @unlink(__DIR__ . '/../' . $worker['image_url']);
            }

            logActivity($conn, $user['id'], 'DELETE_WORKER', "Deleted worker '{$worker['name']}' (Code: {$worker['worker_id']}) from roster.");
            sendSuccess("Worker deleted successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed.", 405);
        break;
}
