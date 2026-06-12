<?php
// User Login API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/jwt.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed. Only POST requests are allowed.", 405);
}

$input = json_decode(file_get_contents("php://input"), true);
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($username) || empty($password)) {
    sendError("Username and password are required.");
}

try {
    // Find active user
    $sql = "SELECT id, username, password_hash, role, name, email, status, last_login, current_login FROM users WHERE username = :username LIMIT 1";
    $stmt = $conn->prepare($sql);
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    if (!$user || $user['status'] !== 'active' || !password_verify($password, $user['password_hash'])) {
        sendError("Invalid username or password.", 401);
    }

    $userId = $user['id'];
    
    // Update login timestamps
    $updateSql = "UPDATE users SET last_login = current_login, current_login = NOW() WHERE id = :id";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->execute([':id' => $userId]);

    // Log the activity
    logActivity($conn, $userId, 'LOGIN', "User '$username' successfully logged in.");

    // Generate token
    $payload = [
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role'],
        'name' => $user['name']
    ];
    $token = generateJWT($payload);

    sendSuccess("Logged in successfully.", [
        "token" => $token,
        "user" => [
            "id" => $user['id'],
            "username" => $user['username'],
            "role" => $user['role'],
            "name" => $user['name'],
            "email" => $user['email']
        ]
    ]);

} catch (PDOException $e) {
    sendError("Database error during login: " . $e->getMessage(), 500);
}
