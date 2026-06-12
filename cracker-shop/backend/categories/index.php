<?php
// Categories CRUD API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Anyone logged in can get categories
        requireAuth();
        try {
            $stmt = $conn->query("SELECT * FROM categories ORDER BY name ASC");
            $categories = $stmt->fetchAll();
            sendSuccess("Categories retrieved successfully.", ["categories" => $categories]);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        // Staff and Admin can create categories
        $user = requireRole(['admin', 'staff']);
        $input = json_decode(file_get_contents("php://input"), true);
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');

        if (empty($name)) {
            sendError("Category name is required.");
        }

        try {
            $check = $conn->prepare("SELECT id FROM categories WHERE name = :name LIMIT 1");
            $check->execute([':name' => $name]);
            if ($check->rowCount() > 0) {
                sendError("Category with this name already exists.");
            }

            $stmt = $conn->prepare("INSERT INTO categories (name, description) VALUES (:name, :description)");
            $stmt->execute([':name' => $name, ':description' => !empty($description) ? $description : null]);
            $newId = $conn->lastInsertId();

            logActivity($conn, $user['id'], 'CREATE_CATEGORY', "Created category '$name'.");
            sendSuccess("Category created successfully.", ["id" => $newId], 201);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        // Admin only can update categories
        $user = requireRole('admin');
        $input = json_decode(file_get_contents("php://input"), true);
        $id = intval($input['id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $description = trim($input['description'] ?? '');

        if ($id <= 0 || empty($name)) {
            sendError("Category ID and name are required.");
        }

        try {
            // Check name duplicate for other categories
            $check = $conn->prepare("SELECT id FROM categories WHERE name = :name AND id != :id LIMIT 1");
            $check->execute([':name' => $name, ':id' => $id]);
            if ($check->rowCount() > 0) {
                sendError("Another category with this name already exists.");
            }

            $stmt = $conn->prepare("UPDATE categories SET name = :name, description = :description WHERE id = :id");
            $stmt->execute([':name' => $name, ':description' => !empty($description) ? $description : null, ':id' => $id]);

            logActivity($conn, $user['id'], 'UPDATE_CATEGORY', "Updated category ID $id to '$name'.");
            sendSuccess("Category updated successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        // Admin only can delete categories
        $user = requireRole('admin');
        $id = intval($_GET['id'] ?? 0);

        if ($id <= 0) {
            sendError("Valid Category ID is required as a query parameter.");
        }

        try {
            // Check if products exist in category
            $checkProd = $conn->prepare("SELECT id FROM products WHERE category_id = :id LIMIT 1");
            $checkProd->execute([':id' => $id]);
            if ($checkProd->rowCount() > 0) {
                sendError("Cannot delete category: products are assigned to this category.");
            }

            // Get category name for logs
            $catStmt = $conn->prepare("SELECT name FROM categories WHERE id = :id LIMIT 1");
            $catStmt->execute([':id' => $id]);
            $category = $catStmt->fetch();
            $catName = $category ? $category['name'] : 'Unknown';

            $stmt = $conn->prepare("DELETE FROM categories WHERE id = :id");
            $stmt->execute([':id' => $id]);

            logActivity($conn, $user['id'], 'DELETE_CATEGORY', "Deleted category '$catName' (ID $id).");
            sendSuccess("Category deleted successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed.", 405);
        break;
}
