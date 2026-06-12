<?php
// Invoice Listing and Cancellation API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = requireAuth();

switch ($method) {
    case 'GET':
        // Retrieve and filter list of invoices
        try {
            $search = trim($_GET['search'] ?? '');
            $status = trim($_GET['status'] ?? '');
            $paymentMethod = trim($_GET['payment_method'] ?? '');
            $startDate = trim($_GET['start_date'] ?? '');
            $endDate = trim($_GET['end_date'] ?? '');

            $query = "SELECT o.*, c.name as customer_name, c.phone as customer_phone, u.name as billing_staff 
                      FROM orders o 
                      LEFT JOIN customers c ON o.customer_id = c.id 
                      LEFT JOIN users u ON o.created_by = u.id 
                      WHERE 1=1";
            $params = [];

            if (!empty($search)) {
                $query .= " AND (o.invoice_no LIKE :search_inv OR c.name LIKE :search_cust OR c.phone LIKE :search_phone)";
                $params[':search_inv'] = "%$search%";
                $params[':search_cust'] = "%$search%";
                $params[':search_phone'] = "%$search%";
            }

            if (!empty($status)) {
                $query .= " AND o.status = :status";
                $params[':status'] = $status;
            }

            if (!empty($paymentMethod)) {
                $query .= " AND o.payment_method = :payment_method";
                $params[':payment_method'] = $paymentMethod;
            }

            if (!empty($startDate)) {
                $query .= " AND o.created_at >= :start_date";
                $params[':start_date'] = $startDate . " 00:00:00";
            }

            if (!empty($endDate)) {
                $query .= " AND o.created_at <= :end_date";
                $params[':end_date'] = $endDate . " 23:59:59";
            }

            $query .= " ORDER BY o.created_at DESC";
            
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            $invoices = $stmt->fetchAll();

            sendSuccess("Invoices list retrieved.", ["invoices" => $invoices]);

        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        // Cancel or Delete an Invoice (Restoring Stock)
        $adminUser = requireRole('admin');
        
        $id = intval($_GET['id'] ?? 0);
        $action = trim($_GET['action'] ?? 'cancel'); // 'cancel' or 'delete'

        if ($id <= 0) {
            sendError("Valid Invoice ID is required.");
        }

        try {
            $conn->beginTransaction();

            // Fetch order details
            $orderStmt = $conn->prepare("SELECT invoice_no, status FROM orders WHERE id = :id FOR UPDATE");
            $orderStmt->execute([':id' => $id]);
            $order = $orderStmt->fetch();

            if (!$order) {
                $conn->rollBack();
                sendError("Invoice not found.");
            }

            $invoiceNo = $order['invoice_no'];
            $currentStatus = $order['status'];

            // 1. Restore stock if invoice was not already Cancelled
            if ($currentStatus !== 'Cancelled') {
                // Fetch items
                $itemsStmt = $conn->prepare("SELECT product_id, quantity FROM order_items WHERE order_id = :order_id");
                $itemsStmt->execute([':order_id' => $id]);
                $items = $itemsStmt->fetchAll();

                // Add quantity back to product stock
                $restoreStmt = $conn->prepare("UPDATE products SET stock = stock + :quantity WHERE id = :product_id");
                foreach ($items as $item) {
                    $restoreStmt->execute([
                        ':quantity' => $item['quantity'],
                        ':product_id' => $item['product_id']
                    ]);
                }
            }

            // 2. Perform the Action
            if ($action === 'delete') {
                // Hard delete from DB (Order Items will cascade delete)
                $delStmt = $conn->prepare("DELETE FROM orders WHERE id = :id");
                $delStmt->execute([':id' => $id]);
                logActivity($conn, $adminUser['id'], 'DELETE_INVOICE', "Hard deleted invoice '$invoiceNo' (ID $id). Stock levels restored.");
                $msg = "Invoice deleted permanently and stock levels restored.";
            } else {
                // Cancel: mark status as 'Cancelled'
                $cancelStmt = $conn->prepare("UPDATE orders SET status = 'Cancelled' WHERE id = :id");
                $cancelStmt->execute([':id' => $id]);
                logActivity($conn, $adminUser['id'], 'CANCEL_INVOICE', "Cancelled invoice '$invoiceNo' (ID $id). Stock levels restored.");
                $msg = "Invoice marked as Cancelled and stock levels restored.";
            }

            $conn->commit();
            sendSuccess($msg);

        } catch (Exception $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }
            sendError("Failed to modify invoice: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed.", 405);
        break;
}
