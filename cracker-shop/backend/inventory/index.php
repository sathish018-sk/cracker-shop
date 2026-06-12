<?php
// Inventory Management API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();

switch ($method) {
    case 'GET':
        // Get full product inventory listing
        try {
            $sql = "SELECT p.id, p.name, p.stock, p.min_stock, p.price, c.name as category_name 
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    ORDER BY p.name ASC";
            $stmt = $conn->query($sql);
            $inventory = $stmt->fetchAll();
            sendSuccess("Inventory data retrieved.", ["inventory" => $inventory]);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        // Adjust stock level manually (Requires Admin or Staff)
        $user = requireRole(['admin', 'staff']);
        $input = json_decode(file_get_contents("php://input"), true);
        
        $productId = intval($input['product_id'] ?? 0);
        $adjustment = intval($input['adjustment'] ?? 0); // Can be positive or negative
        $reason = trim($input['reason'] ?? 'Manual stock adjustment');

        if ($productId <= 0 || $adjustment === 0) {
            sendError("Valid Product ID and non-zero adjustment quantity are required.");
        }

        try {
            // Check if product exists
            $prodStmt = $conn->prepare("SELECT name, stock FROM products WHERE id = :id LIMIT 1");
            $prodStmt->execute([':id' => $productId]);
            $product = $prodStmt->fetch();

            if (!$product) {
                sendError("Product not found.");
            }

            $oldStock = $product['stock'];
            $newStock = $oldStock + $adjustment;

            if ($newStock < 0) {
                sendError("Adjustment invalid: resulting stock cannot be negative (Current: $oldStock).");
            }

            // Update product stock
            $updateStmt = $conn->prepare("UPDATE products SET stock = :stock WHERE id = :id");
            $updateStmt->execute([':stock' => $newStock, ':id' => $productId]);

            logActivity($conn, $user['id'], 'INVENTORY_ADJUST', "Adjusted stock for '{$product['name']}' (ID $productId) by $adjustment. Reason: $reason. Stock went from $oldStock to $newStock.");
            
            sendSuccess("Stock adjusted successfully.", [
                "product_id" => $productId,
                "old_stock" => $oldStock,
                "new_stock" => $newStock
            ]);

        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed.", 405);
        break;
}
