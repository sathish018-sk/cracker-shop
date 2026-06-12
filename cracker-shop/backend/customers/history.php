<?php
// Customer Purchase History API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed.", 405);
}

$customerId = intval($_GET['customer_id'] ?? 0);

if ($customerId <= 0) {
    sendError("Valid customer_id parameter is required.");
}

try {
    // Check if customer exists
    $custCheck = $conn->prepare("SELECT name, phone FROM customers WHERE id = :id LIMIT 1");
    $custCheck->execute([':id' => $customerId]);
    $customer = $custCheck->fetch();

    if (!$customer) {
        sendError("Customer not found.", 404);
    }

    // Get order history
    $sql = "SELECT id, invoice_no, subtotal, discount, tax_amount, convenience_fee, grand_total, payment_method, status, created_at 
            FROM orders 
            WHERE customer_id = :customer_id 
            ORDER BY created_at DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([':customer_id' => $customerId]);
    $orders = $stmt->fetchAll();

    sendSuccess("Customer purchase history retrieved.", [
        "customer" => $customer,
        "orders" => $orders
    ]);

} catch (PDOException $e) {
    sendError("Database error: " . $e->getMessage(), 500);
}
