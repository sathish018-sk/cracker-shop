<?php
// User Registration API (Admin Only)

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

// Require Admin role
$adminUser = requireRole('admin');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed. Only POST requests are allowed.", 405);
}

$input = json_decode(file_get_contents("php://input"), true);
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');
$role = trim($input['role'] ?? 'staff');
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');

if (empty($username) || empty($password) || empty($name)) {
    sendError("Username, password, and name are required fields.");
}

if (!in_array($role, ['admin', 'staff'])) {
    sendError("Invalid role. Role must be 'admin' or 'staff'.");
}

try {
    // Check if username exists
    $checkSql = "SELECT id FROM users WHERE username = :username LIMIT 1";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->execute([':username' => $username]);
    if ($checkStmt->rowCount() > 0) {
        sendError("Username already exists.");
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert user
    $sql = "INSERT INTO users (username, password_hash, role, name, email) VALUES (:username, :password_hash, :role, :name, :email)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':username' => $username,
        ':password_hash' => $passwordHash,
        ':role' => $role,
        ':name' => $name,
        ':email' => !empty($email) ? $email : null
    ]);

    $newUserId = $conn->lastInsertId();

    // Log this activity
    logActivity($conn, $adminUser['id'], 'CREATE_USER', "Created user '$username' with role '$role'.");

    sendSuccess("User registered successfully.", ["user_id" => $newUserId], 21);

} catch (PDOException $e) {
    sendError("Database error during registration: " . $e->getMessage(), 500);
}
