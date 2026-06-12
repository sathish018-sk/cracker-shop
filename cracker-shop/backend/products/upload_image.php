<?php
// Secure Image Upload API

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/auth.php';

// Require authenticated user
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError("Method not allowed. Only POST requests are allowed.", 405);
}

if (!isset($_FILES['image'])) {
    sendError("No image file uploaded.");
}

$file = $_FILES['image'];
$fileName = $file['name'];
$fileTmpName = $file['tmp_name'];
$fileSize = $file['size'];
$fileError = $file['error'];

if ($fileError !== 0) {
    sendError("File upload error code: " . $fileError);
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$fileInfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($fileInfo, $fileTmpName);
finfo_close($fileInfo);

if (!in_array($mimeType, $allowedTypes)) {
    sendError("Invalid file format. Only JPEG, PNG, GIF, and WEBP images are allowed.");
}

// Limit file size (2MB)
$maxSize = 2 * 1024 * 1024; // 2MB
if ($fileSize > $maxSize) {
    sendError("File size exceeds the limit of 2MB.");
}

// Generate unique filename
$ext = pathinfo($fileName, PATHINFO_EXTENSION);
if (empty($ext)) {
    // Fallback based on mime type
    $parts = explode('/', $mimeType);
    $ext = end($parts);
}
$newFileName = uniqid('img_', true) . '.' . strtolower($ext);

// Ensure uploads directory exists
$uploadDir = __DIR__ . '/../uploads/';
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        sendError("Failed to create uploads directory on server.", 500);
    }
}

$destPath = $uploadDir . $newFileName;

if (move_uploaded_file($fileTmpName, $destPath)) {
    // Return relative path
    sendSuccess("Image uploaded successfully.", [
        "image_url" => "uploads/" . $newFileName
    ]);
} else {
    sendError("Failed to save the uploaded image.", 500);
}
