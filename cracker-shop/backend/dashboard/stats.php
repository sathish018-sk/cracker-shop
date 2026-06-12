<?php
// Dashboard Statistics API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed.", 405);
}

try {
    $stats = [];

    // 1. Total Products
    $prodStmt = $conn->query("SELECT COUNT(*) as total FROM products");
    $stats['total_products'] = intval($prodStmt->fetch()['total']);

    // 2. Low Stock Alerts count
    $lowStockStmt = $conn->query("SELECT COUNT(*) as total FROM products WHERE stock <= min_stock");
    $stats['low_stock_count'] = intval($lowStockStmt->fetch()['total']);

    // 3. Total Sales (Paid and Pending)
    $salesStmt = $conn->query("SELECT SUM(grand_total) as total FROM orders WHERE status != 'Cancelled'");
    $stats['total_sales'] = floatval($salesStmt->fetch()['total'] ?? 0.00);

    // 4. Monthly Sales (Current Month)
    $currentMonth = date('m');
    $currentYear = date('Y');
    $monthlyStmt = $conn->prepare("SELECT SUM(grand_total) as total FROM orders WHERE status != 'Cancelled' AND MONTH(created_at) = :month AND YEAR(created_at) = :year");
    $monthlyStmt->execute([':month' => $currentMonth, ':year' => $currentYear]);
    $stats['monthly_sales'] = floatval($monthlyStmt->fetch()['total'] ?? 0.00);

    // 5. Worker Statistics
    $workerStmt = $conn->query("SELECT COUNT(*) as total FROM workers WHERE status = 'Active'");
    $stats['total_workers'] = intval($workerStmt->fetch()['total']);
    
    // Workers Present Today
    $today = date('Y-m-d');
    $attendanceStmt = $conn->prepare("SELECT COUNT(*) as total FROM attendance WHERE date = :date AND status IN ('Present', 'HalfDay')");
    $attendanceStmt->execute([':date' => $today]);
    $stats['workers_present_today'] = intval($attendanceStmt->fetch()['total']);

    // 6. Recent Invoices (Last 5)
    $recentStmt = $conn->query("SELECT o.id, o.invoice_no, o.grand_total, o.payment_method, o.status, o.created_at, c.name as customer_name 
                                FROM orders o 
                                LEFT JOIN customers c ON o.customer_id = c.id 
                                ORDER BY o.created_at DESC 
                                LIMIT 5");
    $stats['recent_invoices'] = $recentStmt->fetchAll();

    // 7. Monthly Sales Chart Data (Last 6 Months)
    $chartSales = [];
    for ($i = 5; $i >= 0; $i--) {
        $m = date('m', strtotime("-$i months"));
        $y = date('Y', strtotime("-$i months"));
        $monthName = date('M', strtotime("-$i months"));
        
        $chartStmt = $conn->prepare("SELECT SUM(grand_total) as total FROM orders WHERE status != 'Cancelled' AND MONTH(created_at) = :month AND YEAR(created_at) = :year");
        $chartStmt->execute([':month' => $m, ':year' => $y]);
        $total = floatval($chartStmt->fetch()['total'] ?? 0.00);
        
        $chartSales[] = [
            "name" => $monthName,
            "sales" => $total
        ];
    }
    $stats['sales_chart'] = $chartSales;

    // 8. Category Breakdown Chart Data
    $catStmt = $conn->query("SELECT c.name as category, SUM(oi.total) as value 
                             FROM order_items oi
                             INNER JOIN products p ON oi.product_id = p.id
                             INNER JOIN categories c ON p.category_id = c.id
                             INNER JOIN orders o ON oi.order_id = o.id
                             WHERE o.status != 'Cancelled'
                             GROUP BY c.id
                             ORDER BY value DESC");
    $stats['category_chart'] = $catStmt->fetchAll();

    sendSuccess("Dashboard statistics loaded.", ["stats" => $stats]);

} catch (PDOException $e) {
    sendError("Database error during dashboard stats generation: " . $e->getMessage(), 500);
}
