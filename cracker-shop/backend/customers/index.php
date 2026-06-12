<?php
// Customers CRUD API

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
            $query = "SELECT c.*, 
                             COUNT(o.id) AS total_orders, 
                             COALESCE(SUM(o.grand_total), 0) AS total_spent 
                      FROM customers c 
                      LEFT JOIN orders o ON o.customer_id = c.id 
                      WHERE 1=1";
            $params = [];

            if (!empty($search)) {
                $query .= " AND (c.name LIKE :search_name OR c.phone LIKE :search_phone)";
                $params[':search_name'] = "%$search%";
                $params[':search_phone'] = "%$search%";
            }

            $query .= " GROUP BY c.id ORDER BY c.name ASC";
            
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            $customers = $stmt->fetchAll();
            
            sendSuccess("Customers retrieved successfully.", ["customers" => $customers]);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents("php://input"), true);
        
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');
        $address = trim($input['address'] ?? '');

        if (empty($name) || empty($phone)) {
            sendError("Customer name and phone number are required.");
        }

        try {
            // Check for duplicate phone number
            $chkPhone = $conn->prepare("SELECT id FROM customers WHERE phone = :phone LIMIT 1");
            $chkPhone->execute([':phone' => $phone]);
            if ($chkPhone->rowCount() > 0) {
                sendError("A customer with this phone number already exists.");
            }

            // Insert customer
            $sql = "INSERT INTO customers (name, phone, email, address) VALUES (:name, :phone, :email, :address)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':phone' => $phone,
                ':email' => !empty($email) ? $email : null,
                ':address' => !empty($address) ? $address : null
            ]);
            $newId = $conn->lastInsertId();

            logActivity($conn, $user['id'], 'CREATE_CUSTOMER', "Registered customer '$name' (Phone: $phone).");
            sendSuccess("Customer registered successfully.", ["id" => $newId], 201);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents("php://input"), true);
        
        $id = intval($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $phone = trim($input['phone'] ?? '');
        $email = trim($input['email'] ?? '');
        $address = trim($input['address'] ?? '');

        if ($id <= 0 || empty($name) || empty($phone)) {
            sendError("Customer ID, name, and phone number are required.");
        }

        try {
            // Check if customer exists
            $chkCust = $conn->prepare("SELECT id FROM customers WHERE id = :id");
            $chkCust->execute([':id' => $id]);
            if ($chkCust->rowCount() === 0) {
                sendError("Customer not found.");
            }

            // Check for duplicate phone for other customers
            $chkPhone = $conn->prepare("SELECT id FROM customers WHERE phone = :phone AND id != :id LIMIT 1");
            $chkPhone->execute([':phone' => $phone, ':id' => $id]);
            if ($chkPhone->rowCount() > 0) {
                sendError("Another customer is already registered with this phone number.");
            }

            // Update customer
            $sql = "UPDATE customers SET name = :name, phone = :phone, email = :email, address = :address WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':phone' => $phone,
                ':email' => !empty($email) ? $email : null,
                ':address' => !empty($address) ? $address : null,
                ':id' => $id
            ]);

            logActivity($conn, $user['id'], 'UPDATE_CUSTOMER', "Updated customer details for '$name' (ID $id).");
            sendSuccess("Customer updated successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        // Only Admin can delete customer records
        $user = requireRole('admin');
        $id = intval($_GET['id'] ?? 0);

        if ($id <= 0) {
            sendError("Valid Customer ID is required as a query parameter.");
        }

        try {
            $custStmt = $conn->prepare("SELECT name FROM customers WHERE id = :id LIMIT 1");
            $custStmt->execute([':id' => $id]);
            $customer = $custStmt->fetch();

            if (!$customer) {
                sendError("Customer not found.");
            }

            $stmt = $conn->prepare("DELETE FROM customers WHERE id = :id");
            $stmt->execute([':id' => $id]);

            logActivity($conn, $user['id'], 'DELETE_CUSTOMER', "Deleted customer '{$customer['name']}' (ID $id).");
            sendSuccess("Customer deleted successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed.", 405);
        break;
}
