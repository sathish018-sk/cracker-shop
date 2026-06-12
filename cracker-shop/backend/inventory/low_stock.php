<?php
// Low Stock Alerts API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed.", 405);
}

try {
    $sql = "SELECT p.id, p.name, p.stock, p.min_stock, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock <= p.min_stock
            ORDER BY p.stock ASC";
    $stmt = $conn->query($sql);
    $lowStockProducts = $stmt->fetchAll();

    sendSuccess("Low stock report retrieved.", [
        "low_stock_count" => count($lowStockProducts),
        "products" => $lowStockProducts
    ]);

} catch (PDOException $e) {
    sendError("Database error: " . $e->getMessage(), 500);
}
