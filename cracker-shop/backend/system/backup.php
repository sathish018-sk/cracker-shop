<?php
// Database Backup & Restore API (Admin Only)

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

// Require Admin role
$adminUser = requireRole('admin');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Retrieve backup history
        try {
            $stmt = $conn->query("SELECT * FROM backups ORDER BY created_at DESC");
            $backups = $stmt->fetchAll();
            sendSuccess("Database backup history retrieved.", ["backups" => $backups]);
        } catch (PDOException $e) {
            sendError("Database error: " . $e->getMessage(), 500);
        }
        break;

    case 'POST':
        // Trigger a new pure-PHP database backup
        try {
            // Ensure backups directory exists
            $backupDir = __DIR__ . '/../backups/';
            if (!file_exists($backupDir)) {
                if (!mkdir($backupDir, 0755, true)) {
                    sendError("Failed to create backups folder on server.", 500);
                }
            }

            // Fetch all tables
            $tables = [];
            $stmt = $conn->query("SHOW TABLES");
            while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
                $tables[] = $row[0];
            }

            $sqlContent = "-- SM Crackers Database Backup\n";
            $sqlContent .= "-- Generated on " . date('Y-m-d H:i:s') . "\n\n";
            $sqlContent .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

            foreach ($tables as $table) {
                // Ignore backup log table itself to prevent circular restores
                if ($table === 'backups') continue;

                // 1. Get Create Table statement
                $createStmt = $conn->query("SHOW CREATE TABLE `$table`")->fetch();
                $sqlContent .= "\n\n" . $createStmt['Create Table'] . ";\n\n";

                // 2. Fetch all rows
                $rowsStmt = $conn->query("SELECT * FROM `$table`");
                $rows = $rowsStmt->fetchAll(PDO::FETCH_ASSOC);

                if (!empty($rows)) {
                    $sqlContent .= "INSERT INTO `$table` (";
                    $cols = array_keys($rows[0]);
                    $sqlContent .= implode(", ", array_map(function($c) { return "`$c`"; }, $cols));
                    $sqlContent .= ") VALUES\n";

                    $valueLines = [];
                    foreach ($rows as $row) {
                        $values = [];
                        foreach ($row as $val) {
                            if (is_null($val)) {
                                $values[] = "NULL";
                            } else {
                                $values[] = $conn->quote($val);
                            }
                        }
                        $valueLines[] = "(" . implode(", ", $values) . ")";
                    }
                    $sqlContent .= implode(",\n", $valueLines) . ";\n";
                }
            }

            $sqlContent .= "\nSET FOREIGN_KEY_CHECKS = 1;\n";

            // Save to file
            $fileName = 'backup_' . date('Ymd_His') . '_' . rand(100, 999) . '.sql';
            $filePath = 'backups/' . $fileName;
            
            if (file_put_contents($backupDir . $fileName, $sqlContent) === false) {
                sendError("Failed to write SQL file to disk.", 500);
            }

            // Save log details into database
            $insStmt = $conn->prepare("INSERT INTO backups (file_name, file_path) VALUES (:name, :path)");
            $insStmt->execute([':name' => $fileName, ':path' => $filePath]);

            logActivity($conn, $adminUser['id'], 'DB_BACKUP', "Created database backup file '$fileName'.");
            
            sendSuccess("Database backup created successfully.", ["file_name" => $fileName], 201);

        } catch (Exception $e) {
            sendError("Failed to perform backup: " . $e->getMessage(), 500);
        }
        break;

    case 'PUT':
        // Restore database from a backup
        $input = json_decode(file_get_contents("php://input"), true);
        $backupId = intval($input['id'] ?? 0);

        if ($backupId <= 0) {
            sendError("Valid Backup ID is required for restore.");
        }

        try {
            // Get backup file details
            $chkStmt = $conn->prepare("SELECT file_name FROM backups WHERE id = :id LIMIT 1");
            $chkStmt->execute([':id' => $backupId]);
            $backup = $chkStmt->fetch();

            if (!$backup) {
                sendError("Backup record not found.");
            }

            $fileName = $backup['file_name'];
            $backupPath = __DIR__ . '/../backups/' . $fileName;

            if (!file_exists($backupPath)) {
                sendError("Backup SQL file does not exist on server.", 404);
            }

            // Read SQL content
            $sqlContent = file_get_contents($backupPath);

            // Execute SQL commands
            // Disable foreign keys temporarily
            $conn->exec("SET FOREIGN_KEY_CHECKS = 0;");
            
            // Basic splitter (Note: queries are separated by ;)
            // We split by ';' but try to be smart about line endings
            $queries = explode(";\n", $sqlContent);
            
            $executedCount = 0;
            foreach ($queries as $query) {
                $query = trim($query);
                if (!empty($query)) {
                    $conn->exec($query);
                    $executedCount++;
                }
            }

            $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");

            logActivity($conn, $adminUser['id'], 'DB_RESTORE', "Restored database from backup file '$fileName'.");
            sendSuccess("Database restored successfully from backup '$fileName'.");

        } catch (Exception $e) {
            // Re-enable key checks in case of failure
            $conn->exec("SET FOREIGN_KEY_CHECKS = 1;");
            sendError("Database restore failed: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError("Method not allowed.", 405);
        break;
}
