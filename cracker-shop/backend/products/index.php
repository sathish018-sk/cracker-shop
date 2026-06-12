<?php
// Products CRUD API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Anyone logged in can get products
        requireAuth();
        try {
            $categoryId = intval($_GET['category_id'] ?? 0);
            $search = trim($_GET['search'] ?? '');
            
            $query = "SELECT p.*, c.name as category_name 
                      FROM products p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      WHERE 1=1";
            $params = [];

            if ($categoryId > 0) {
                $query .= " AND p.category_id = :category_id";
                $params[':category_id'] = $categoryId;
            }

            if (!empty($search)) {
                $query .= " AND (p.name LIKE :search_name OR c.name LIKE :search_cat)";
                $params[':search_name'] = "%$search%";
                $params[':search_cat'] = "%$search%";
            }

            $query .= " ORDER BY p.name ASC";
            
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            $products = $stmt->fetchAll();
            
            sendSuccess("Products retrieved successfully.", ["products" => $products]);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        // Staff and Admin can create products
        $user = requireRole(['admin', 'staff']);
        $input = json_decode(file_get_contents("php://input"), true);
        
        $categoryId = intval($input['category_id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $price = floatval($input['price'] ?? 0.00);
        $stock = intval($input['stock'] ?? 0);
        $minStock = intval($input['min_stock'] ?? 10);
        $imageUrl = trim($input['image_url'] ?? '');

        if (empty($name) || $price < 0) {
            sendError("Product name and valid price are required.");
        }

        try {
            // Check if category exists if provided
            if ($categoryId > 0) {
                $chkCat = $conn->prepare("SELECT id FROM categories WHERE id = :id");
                $chkCat->execute([':id' => $categoryId]);
                if ($chkCat->rowCount() === 0) {
                    sendError("Invalid category ID.");
                }
            } else {
                $categoryId = null;
            }

            // Insert product
            $sql = "INSERT INTO products (category_id, name, price, stock, min_stock, image_url) 
                    VALUES (:category_id, :name, :price, :stock, :min_stock, :image_url)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':category_id' => $categoryId,
                ':name' => $name,
                ':price' => $price,
                ':stock' => $stock,
                ':min_stock' => $minStock,
                ':image_url' => $imageUrl
            ]);
            $newId = $conn->lastInsertId();

            logActivity($conn, $user['id'], 'CREATE_PRODUCT', "Created product '$name' (ID $newId) with price $price and stock $stock.");
            sendSuccess("Product created successfully.", ["id" => $newId], 201);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        // Staff and Admin can update products
        $user = requireRole(['admin', 'staff']);
        $input = json_decode(file_get_contents("php://input"), true);
        
        $id = intval($input['id'] ?? 0);
        $categoryId = intval($input['category_id'] ?? 0);
        $name = trim($input['name'] ?? '');
        $price = floatval($input['price'] ?? 0.00);
        $stock = intval($input['stock'] ?? 0);
        $minStock = intval($input['min_stock'] ?? 10);
        $imageUrl = trim($input['image_url'] ?? '');

        if ($id <= 0 || empty($name) || $price < 0) {
            sendError("Product ID, name, and valid price are required.");
        }

        try {
            // Check if product exists
            $checkProd = $conn->prepare("SELECT id FROM products WHERE id = :id");
            $checkProd->execute([':id' => $id]);
            if ($checkProd->rowCount() === 0) {
                sendError("Product not found.");
            }

            // Check if category exists if provided
            if ($categoryId > 0) {
                $chkCat = $conn->prepare("SELECT id FROM categories WHERE id = :id");
                $chkCat->execute([':id' => $categoryId]);
                if ($chkCat->rowCount() === 0) {
                    sendError("Invalid category ID.");
                }
            } else {
                $categoryId = null;
            }

            // Update product
            $sql = "UPDATE products 
                    SET category_id = :category_id, name = :name, price = :price, stock = :stock, min_stock = :min_stock, image_url = :image_url 
                    WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':category_id' => $categoryId,
                ':name' => $name,
                ':price' => $price,
                ':stock' => $stock,
                ':min_stock' => $minStock,
                ':image_url' => $imageUrl,
                ':id' => $id
            ]);

            logActivity($conn, $user['id'], 'UPDATE_PRODUCT', "Updated product '$name' (ID $id). New price: $price, stock: $stock.");
            sendSuccess("Product updated successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        // Admin only can delete products
        $user = requireRole('admin');
        $id = intval($_GET['id'] ?? 0);

        if ($id <= 0) {
            sendError("Valid Product ID is required as a query parameter.");
        }

        try {
            // Get product name for logging
            $prodStmt = $conn->prepare("SELECT name, image_url FROM products WHERE id = :id LIMIT 1");
            $prodStmt->execute([':id' => $id]);
            $product = $prodStmt->fetch();

            if (!$product) {
                sendError("Product not found.");
            }

            $prodName = $product['name'];
            $imgUrl = $product['image_url'];

            // Delete product
            $stmt = $conn->prepare("DELETE FROM products WHERE id = :id");
            $stmt->execute([':id' => $id]);

            // Try to delete image if exists and local
            if (!empty($imgUrl) && file_exists(__DIR__ . '/../' . $imgUrl)) {
                @unlink(__DIR__ . '/../' . $imgUrl);
            }

            logActivity($conn, $user['id'], 'DELETE_PRODUCT', "Deleted product '$prodName' (ID $id).");
            sendSuccess("Product deleted successfully.");
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed.", 405);
        break;
}
