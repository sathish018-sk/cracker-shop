<?php
// Response Helper Functions

function sendResponse($status, $message, $data = [], $code = 200) {
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code($code);
    
    $response = [
        "status" => $status,
        "message" => $message
    ];
    
    if (!empty($data) || is_array($data)) {
        $response["data"] = $data;
    }
    
    echo json_encode($response);
    exit;
}

function sendError($message, $code = 400, $data = []) {
    sendResponse("error", $message, $data, $code);
}

function sendSuccess($message, $data = [], $code = 200) {
    sendResponse("success", $message, $data, $code);
}
