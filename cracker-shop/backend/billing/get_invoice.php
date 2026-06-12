<?php
// Get Invoice Details API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed.", 405);
}

$id = intval($_GET['id'] ?? 0);
$invoiceNo = trim($_GET['invoice_no'] ?? '');

if ($id <= 0 && empty($invoiceNo)) {
    sendError("Invoice ID or Invoice Number is required.");
}

try {
    // 1. Fetch main order information
    $orderQuery = "SELECT o.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, c.email as customer_email, u.name as billing_staff 
                  FROM orders o 
                  LEFT JOIN customers c ON o.customer_id = c.id 
                  LEFT JOIN users u ON o.created_by = u.id 
                  WHERE ";
    
    $params = [];
    if ($id > 0) {
        $orderQuery .= "o.id = :id";
        $params[':id'] = $id;
    } else {
        $orderQuery .= "o.invoice_no = :invoice_no";
        $params[':invoice_no'] = $invoiceNo;
    }
    
    $stmt = $conn->prepare($orderQuery);
    $stmt->execute($params);
    $order = $stmt->fetch();

    if (!$order) {
        sendError("Invoice not found.", 404);
    }

    // 2. Fetch order items
    $itemsQuery = "SELECT oi.*, p.name as product_name, cat.name as category_name 
                   FROM order_items oi 
                   LEFT JOIN products p ON oi.product_id = p.id 
                   LEFT JOIN categories cat ON p.category_id = cat.id 
                   WHERE oi.order_id = :order_id";
    
    $itemsStmt = $conn->prepare($itemsQuery);
    $itemsStmt->execute([':order_id' => $order['id']]);
    $items = $itemsStmt->fetchAll();

    sendSuccess("Invoice details retrieved.", [
        "invoice" => $order,
        "items" => $items
    ]);

} catch (PDOException $e) {
    sendError("Database error: " . $e->getMessage(), 500);
}
