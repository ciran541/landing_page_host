<?php
// Enable error reporting for testing
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Allow CORS for local testing
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://guide.theloanconnection.com.sg/');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Google Sheet URL - This will be hidden from frontend
$googleSheetURL = 'https://script.google.com/macros/s/AKfycby3pBqk7IwhxPy2i-QGZU9oUqUfPlF-5Rklt5LKluaYGvDbg-b48_MogK7D12NNuDzy/exec';

// Create a log file for debugging
function writeToLog($data) {
    $logFile = 'form_submissions.log';
    $timestamp = date('Y-m-d H:i:s');
    $logData = $timestamp . ' - ' . print_r($data, true) . "\n";
    file_put_contents($logFile, $logData, FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get POST data
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        // Log the received data
        writeToLog(['Received Data' => $data]);
        
        // Validate required fields
        $requiredFields = ['loan_type', 'name', 'email', 'contact'];
        foreach ($requiredFields as $field) {
            if (empty($data[$field])) {
                throw new Exception("Missing required field: $field");
            }
        }
        
        // Prepare data for Google Sheets
        $formData = array(
            'loan_type' => $data['loan_type'] ?? '',
            'property_type' => $data['property_type'] ?? '',
            'property_purchase' => $data['property_purchase'] ?? '',
            'loan_amount' => $data['loan_amount'] ?? '',
            'rate_type' => $data['rate_type'] ?? '',
            'name' => $data['name'] ?? '',
            'email' => $data['email'] ?? '',
            'contact' => $data['contact'] ?? '',
            'submission_date' => date('Y-m-d H:i:s')
        );
        
        // Log the formatted data
        writeToLog(['Formatted Data' => $formData]);
        
        // Send to Google Sheet
        $ch = curl_init($googleSheetURL);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($formData));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        
        // Log the response
        writeToLog(['API Response' => $response]);
        
        if (curl_errno($ch)) {
            throw new Exception(curl_error($ch));
        }
        
        curl_close($ch);
        
        echo json_encode(['success' => true]);
        
    } catch (Exception $e) {
        // Log the error
        writeToLog(['Error' => $e->getMessage()]);
        
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}