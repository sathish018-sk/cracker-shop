<?php
// Checkout & Invoice Generation API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

$user = requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed. Only POST requests are allowed.", 405);
}

$input = json_decode(file_get_contents("php://input"), true);

$customerId = intval($input['customer_id'] ?? 0);
$customerName = trim($input['customer_name'] ?? '');
$customerPhone = trim($input['customer_phone'] ?? '');
$customerAddress = trim($input['customer_address'] ?? '');

$items = $input['items'] ?? []; // Array of ['product_id' => X, 'quantity' => Y]
$discount = floatval($input['discount'] ?? 0.00);
$taxRate = floatval($input['tax_rate'] ?? 0.00); // e.g. 18.00 (in percent)
$convenienceFee = floatval($input['convenience_fee'] ?? 0.00);
$paymentMethod = trim($input['payment_method'] ?? 'Cash');
$status = trim($input['status'] ?? 'Paid');

if (empty($items)) {
    sendError("Shopping cart is empty. Please add items to check out.");
}

if (!in_array($paymentMethod, ['Cash', 'Card', 'UPI'])) {
    $paymentMethod = 'Cash';
}

if (!in_array($status, ['Paid', 'Pending'])) {
    $status = 'Paid';
}

try {
    $conn->beginTransaction();

    // 1. Manage Customer details
    // If customer_id is 0 but customerPhone is provided, look up or create
    if ($customerId <= 0 && !empty($customerPhone)) {
        $custStmt = $conn->prepare("SELECT id FROM customers WHERE phone = :phone LIMIT 1");
        $custStmt->execute([':phone' => $customerPhone]);
        $existingCust = $custStmt->fetch();

        if ($existingCust) {
            $customerId = $existingCust['id'];
        } else {
            // Register new customer
            if (empty($customerName)) {
                $customerName = "Walk-in Customer";
            }
            $insCust = $conn->prepare("INSERT INTO customers (name, phone, address) VALUES (:name, :phone, :address)");
            $insCust->execute([
                ':name' => $customerName,
                ':phone' => $customerPhone,
                ':address' => !empty($customerAddress) ? $customerAddress : null
            ]);
            $customerId = $conn->lastInsertId();
            logActivity($conn, $user['id'], 'CREATE_CUSTOMER', "Registered customer '$customerName' (ID $customerId) during billing.");
        }
    } elseif ($customerId <= 0 && empty($customerPhone) && !empty($customerName)) {
        // Create generic customer record without phone
        $dummyPhone = 'TEMP-' . time() . '-' . rand(10, 99);
        $insCust = $conn->prepare("INSERT INTO customers (name, phone, address) VALUES (:name, :phone, :address)");
        $insCust->execute([
            ':name' => $customerName,
            ':phone' => $dummyPhone,
            ':address' => !empty($customerAddress) ? $customerAddress : null
        ]);
        $customerId = $conn->lastInsertId();
    }

    $finalCustomerId = $customerId > 0 ? $customerId : null;

    // 2. Process items and calculate prices
    $subtotal = 0.00;
    $processedItems = [];

    foreach ($items as $item) {
        $productId = intval($item['product_id'] ?? 0);
        $quantity = intval($item['quantity'] ?? 0);

        if ($productId <= 0 || $quantity <= 0) {
            $conn->rollBack();
            sendError("Invalid items in the shopping cart.");
        }

        // Fetch product info with FOR UPDATE locks to prevent race conditions in stock depletion
        $prodStmt = $conn->prepare("SELECT id, name, price, stock FROM products WHERE id = :id FOR UPDATE");
        $prodStmt->execute([':id' => $productId]);
        $product = $prodStmt->fetch();

        if (!$product) {
            $conn->rollBack();
            sendError("Product (ID $productId) not found.");
        }

        if ($product['stock'] < $quantity) {
            $conn->rollBack();
            sendError("Insufficient stock for product '{$product['name']}'. Requested: $quantity, Available: {$product['stock']}");
        }

        $price = floatval($product['price']);
        $totalItemPrice = $price * $quantity;
        $subtotal += $totalItemPrice;

        // Decrement product stock
        $newStock = $product['stock'] - $quantity;
        $stockStmt = $conn->prepare("UPDATE products SET stock = :stock WHERE id = :id");
        $stockStmt->execute([':stock' => $newStock, ':id' => $productId]);

        $processedItems[] = [
            'product_id' => $productId,
            'name' => $product['name'],
            'quantity' => $quantity,
            'price' => $price,
            'total' => $totalItemPrice
        ];
    }

    // 3. Totals Calculation
    // Apply discount
    $discountableAmount = $subtotal;
    if ($discount > $discountableAmount) {
        $discount = $discountableAmount;
    }
    $taxableAmount = $discountableAmount - $discount;
    
    // Tax (GST)
    $taxAmount = 0.00;
    if ($taxRate > 0) {
        $taxAmount = $taxableAmount * ($taxRate / 100.00);
    }

    // Grand Total
    $grandTotal = $taxableAmount + $taxAmount + $convenienceFee;

    // 4. Generate Invoice Number
    // Format: INV-YYYYMMDD-RAND
    $invoiceNo = 'INV-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -5));

    // 5. Create Order
    $orderSql = "INSERT INTO orders (invoice_no, customer_id, subtotal, discount, tax_rate, tax_amount, convenience_fee, grand_total, payment_method, status, created_by) 
                 VALUES (:invoice_no, :customer_id, :subtotal, :discount, :tax_rate, :tax_amount, :convenience_fee, :grand_total, :payment_method, :status, :created_by)";
    $orderStmt = $conn->prepare($orderSql);
    $orderStmt->execute([
        ':invoice_no' => $invoiceNo,
        ':customer_id' => $finalCustomerId,
        ':subtotal' => $subtotal,
        ':discount' => $discount,
        ':tax_rate' => $taxRate,
        ':tax_amount' => $taxAmount,
        ':convenience_fee' => $convenienceFee,
        ':grand_total' => $grandTotal,
        ':payment_method' => $paymentMethod,
        ':status' => $status,
        ':created_by' => $user['id']
    ]);
    $orderId = $conn->lastInsertId();

    // 6. Insert Order Items
    $itemSql = "INSERT INTO order_items (order_id, product_id, quantity, price, total) 
                VALUES (:order_id, :product_id, :quantity, :price, :total)";
    $itemStmt = $conn->prepare($itemSql);

    foreach ($processedItems as $item) {
        $itemStmt->execute([
            ':order_id' => $orderId,
            ':product_id' => $item['product_id'],
            ':quantity' => $item['quantity'],
            ':price' => $item['price'],
            ':total' => $item['total']
        ]);
    }

    // Write audit log
    logActivity($conn, $user['id'], 'CREATE_INVOICE', "Generated invoice '$invoiceNo' (ID $orderId) for total amount ₹" . number_format($grandTotal, 2));

    $conn->commit();

    sendSuccess("Invoice created successfully.", [
        "invoice_id" => $orderId,
        "invoice_no" => $invoiceNo,
        "grand_total" => $grandTotal
    ], 201);

} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    sendError("Checkout transaction failed: " . $e->getMessage(), 500);
}
