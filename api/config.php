<?php
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$BASE_DIR   = dirname(__DIR__);
$DATA_DIR   = $BASE_DIR . '/data';
$USERS_FILE = $DATA_DIR . '/users.json';
$CONFIGS_DIR = $DATA_DIR . '/user-configs';

if (!is_dir($DATA_DIR)) mkdir($DATA_DIR, 0755, true);
if (!is_dir($CONFIGS_DIR)) mkdir($CONFIGS_DIR, 0755, true);

function readJSON($path) {
    if (!file_exists($path)) return null;
    $raw = file_get_contents($path);
    $data = json_decode($raw, true);
    return json_last_error() === JSON_ERROR_NONE ? $data : null;
}

function writeJSON($path, $data) {
    $dir = dirname($path);
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return file_put_contents($path, $json, LOCK_EX) !== false;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError($msg, $code = 400) {
    jsonResponse(['ok' => false, 'error' => $msg], $code);
}

function requireAuth() {
    if (empty($_SESSION['user_id'])) jsonError('No autenticado', 401);
    return [
        'id'    => $_SESSION['user_id'],
        'user'  => $_SESSION['username'],
        'role'  => $_SESSION['role']
    ];
}

function requireAdmin() {
    $u = requireAuth();
    if ($u['role'] !== 'admin') jsonError('Sin permisos de administrador', 403);
    return $u;
}

function loadUsers() {
    global $USERS_FILE;
    $users = readJSON($USERS_FILE);
    return is_array($users) ? $users : [];
}

function saveUsers($users) {
    global $USERS_FILE;
    return writeJSON($USERS_FILE, $users);
}

function findUser($username) {
    $users = loadUsers();
    foreach ($users as $u) {
        if ($u['username'] === $username) return $u;
    }
    return null;
}

function getUserConfigPath($username) {
    global $CONFIGS_DIR;
    return $CONFIGS_DIR . '/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $username) . '.json';
}

function loadUserConfig($username) {
    $path = getUserConfigPath($username);
    $cfg = readJSON($path);
    return is_array($cfg) ? $cfg : ['overrides' => [], 'whatsapp' => ''];
}

function saveUserConfig($username, $config) {
    $path = getUserConfigPath($username);
    return writeJSON($path, $config);
}

function seedAdmin() {
    $users = loadUsers();
    if (count($users) > 0) return;
    $admin = [
        'id'            => bin2hex(random_bytes(16)),
        'username'      => 'admin',
        'password_hash' => password_hash('editor2026', PASSWORD_BCRYPT),
        'role'          => 'admin',
        'created_at'    => date('c'),
        'updated_at'    => date('c')
    ];
    saveUsers([$admin]);
    saveUserConfig('admin', ['overrides' => [], 'whatsapp' => '']);
}

seedAdmin();
