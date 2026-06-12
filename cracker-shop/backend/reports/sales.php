<?php
// Sales Reports API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError("Method not allowed.", 405);
}

$startDate = trim($_GET['start_date'] ?? date('Y-m-01')); // Default to 1st day of current month
$endDate = trim($_GET['end_date'] ?? date('Y-m-d'));

if (empty($startDate) || empty($endDate)) {
    sendError("Start date and End date parameters are required.");
}

try {
    $report = [];

    // Format parameters for datetime querying
    $startParam = $startDate . " 00:00:00";
    $endParam = $endDate . " 23:59:59";

    // 1. Overall Summary
    $summarySql = "SELECT COUNT(*) as total_orders, 
                          COALESCE(SUM(subtotal), 0.00) as total_subtotal,
                          COALESCE(SUM(discount), 0.00) as total_discount,
                          COALESCE(SUM(tax_amount), 0.00) as total_tax,
                          COALESCE(SUM(convenience_fee), 0.00) as total_fees,
                          COALESCE(SUM(grand_total), 0.00) as total_revenue
                   FROM orders 
                   WHERE status != 'Cancelled' AND created_at BETWEEN :start_date AND :end_date";
    
    $summaryStmt = $conn->prepare($summarySql);
    $summaryStmt->execute([':start_date' => $startParam, ':end_date' => $endParam]);
    $report['summary'] = $summaryStmt->fetch();

    // 2. Daily Sales Trend
    $dailySql = "SELECT DATE(created_at) as sale_date, 
                        COUNT(*) as order_count, 
                        SUM(grand_total) as daily_revenue 
                 FROM orders 
                 WHERE status != 'Cancelled' AND created_at BETWEEN :start_date AND :end_date
                 GROUP BY DATE(created_at) 
                 ORDER BY sale_date ASC";
                 
    $dailyStmt = $conn->prepare($dailySql);
    $dailyStmt->execute([':start_date' => $startParam, ':end_date' => $endParam]);
    $report['daily_sales'] = $dailyStmt->fetchAll();

    // 3. Product Sales Performance
    $productSql = "SELECT p.name as product_name, c.name as category_name, 
                          SUM(oi.quantity) as quantity_sold, 
                          SUM(oi.total) as total_revenue 
                   FROM order_items oi
                   INNER JOIN products p ON oi.product_id = p.id
                   INNER JOIN categories c ON p.category_id = c.id
                   INNER JOIN orders o ON oi.order_id = o.id
                   WHERE o.status != 'Cancelled' AND o.created_at BETWEEN :start_date AND :end_date
                   GROUP BY p.id
                   ORDER BY quantity_sold DESC";
                   
    $productStmt = $conn->prepare($productSql);
    $productStmt->execute([':start_date' => $startParam, ':end_date' => $endParam]);
    $report['product_sales'] = $productStmt->fetchAll();

    sendSuccess("Sales report generated successfully.", [
        "start_date" => $startDate,
        "end_date" => $endDate,
        "report" => $report
    ]);

} catch (PDOException $e) {
    sendError("Database error during sales report generation: " . $e->getMessage(), 500);
}
