<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($method === 'POST' && $action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) $input = $_POST;

    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if ($username === '' || $password === '') {
        jsonError('Usuario y contraseña son obligatorios');
    }

    $user = findUser($username);
    if (!$user || !password_verify($password, $user['password_hash'])) {
        jsonError('Usuario o contraseña incorrectos', 401);
    }

    $_SESSION['user_id']  = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role']     = $user['role'];

    jsonResponse([
        'ok'       => true,
        'username' => $user['username'],
        'role'     => $user['role']
    ]);
}

if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    jsonResponse(['ok' => true]);
}

if ($method === 'GET' && $action === 'check') {
    if (empty($_SESSION['user_id'])) {
        jsonResponse(['logged_in' => false]);
    }
    jsonResponse([
        'logged_in' => true,
        'username'  => $_SESSION['username'],
        'role'      => $_SESSION['role']
    ]);
}

jsonError('Acción no válida');
