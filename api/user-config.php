<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$currentUser = requireAuth();

/* ---------- GET: obtener config ---------- */
if ($method === 'GET') {
    if ($currentUser['role'] === 'admin' && isset($_GET['username'])) {
        $cfg = loadUserConfig($_GET['username']);
    } else {
        $cfg = loadUserConfig($currentUser['user']);
    }
    jsonResponse(['ok' => true, 'config' => $cfg]);
}

/* ---------- PUT/POST: guardar config ---------- */
if ($method === 'POST' || $method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) jsonError('Datos inválidos');

    $targetUser = $currentUser['user'];

    if ($currentUser['role'] === 'admin' && isset($input['username'])) {
        $targetUser = $input['username'];
    }

    $config = loadUserConfig($targetUser);

    if (isset($input['overrides'])) {
        $config['overrides'] = $input['overrides'];
    }
    if (isset($input['whatsapp'])) {
        $config['whatsapp'] = $input['whatsapp'];
    }

    saveUserConfig($targetUser, $config);
    jsonResponse(['ok' => true, 'config' => $config]);
}

jsonError('Acción no válida');
