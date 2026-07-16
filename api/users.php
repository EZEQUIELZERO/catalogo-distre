<?php
require_once __DIR__ . '/config.php';

$method  = $_SERVER['REQUEST_METHOD'];
$action  = $_GET['action'] ?? '';

/* ---------- GET: listar usuarios ---------- */
if ($method === 'GET' && $action === '') {
    $currentUser = requireAuth();
    $users = loadUsers();

    if ($currentUser['role'] === 'admin') {
        $safe = array_map(function ($u) {
            return [
                'id'         => $u['id'],
                'username'   => $u['username'],
                'role'       => $u['role'],
                'created_at' => $u['created_at'],
                'updated_at' => $u['updated_at']
            ];
        }, $users);
        jsonResponse(['ok' => true, 'users' => $safe]);
    }

    foreach ($users as $u) {
        if ($u['id'] === $currentUser['id']) {
            jsonResponse(['ok' => true, 'users' => [[
                'id'         => $u['id'],
                'username'   => $u['username'],
                'role'       => $u['role'],
                'created_at' => $u['created_at'],
                'updated_at' => $u['updated_at']
            ]]]);
        }
    }
    jsonError('Usuario no encontrado', 404);
}

/* ---------- POST: crear usuario ---------- */
if ($method === 'POST' && $action === '') {
    $admin = requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) jsonError('Datos inválidos');

    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $role     = $input['role'] ?? 'usuario';

    if ($username === '' || $password === '') {
        jsonError('Usuario y contraseña son obligatorios');
    }
    if (strlen($username) < 3) {
        jsonError('El nombre de usuario debe tener al menos 3 caracteres');
    }
    if (strlen($password) < 6) {
        jsonError('La contraseña debe tener al menos 6 caracteres');
    }
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
        jsonError('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos');
    }
    if (!in_array($role, ['admin', 'usuario'])) {
        jsonError('Rol inválido');
    }

    $existing = findUser($username);
    if ($existing) {
        jsonError('Ya existe un usuario con ese nombre');
    }

    $newUser = [
        'id'            => bin2hex(random_bytes(16)),
        'username'      => $username,
        'password_hash' => password_hash($password, PASSWORD_BCRYPT),
        'role'          => $role,
        'created_at'    => date('c'),
        'updated_at'    => date('c')
    ];

    $users = loadUsers();
    $users[] = $newUser;
    saveUsers($users);

    saveUserConfig($username, ['overrides' => [], 'whatsapp' => '']);

    jsonResponse([
        'ok'       => true,
        'user'     => [
            'id'         => $newUser['id'],
            'username'   => $newUser['username'],
            'role'       => $newUser['role'],
            'created_at' => $newUser['created_at'],
            'updated_at' => $newUser['updated_at']
        ]
    ]);
}

/* ---------- PUT: editar usuario ---------- */
if ($method === 'PUT') {
    $currentUser = requireAuth();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) jsonError('Datos inválidos');

    $targetId   = $input['id'] ?? '';
    $newRole    = $input['role'] ?? null;
    $newPass    = $input['password'] ?? null;
    $newName    = $input['username'] ?? null;

    $users = loadUsers();
    $targetIdx = null;
    foreach ($users as $i => $u) {
        if ($u['id'] === $targetId) { $targetIdx = $i; break; }
    }
    if ($targetIdx === null) jsonError('Usuario no encontrado', 404);

    $target = &$users[$targetIdx];

    if ($currentUser['role'] !== 'admin' && $currentUser['id'] !== $targetId) {
        jsonError('Solo puedes editar tu propio perfil', 403);
    }

    if ($currentUser['role'] !== 'admin' && $newRole !== null) {
        jsonError('No puedes cambiar tu propio rol', 403);
    }

    if ($newRole !== null && $currentUser['role'] === 'admin') {
        if (!in_array($newRole, ['admin', 'usuario'])) jsonError('Rol inválido');
        $target['role'] = $newRole;
    }

    if ($newPass !== null && $newPass !== '') {
        if (strlen($newPass) < 6) jsonError('La contraseña debe tener al menos 6 caracteres');
        $target['password_hash'] = password_hash($newPass, PASSWORD_BCRYPT);
    }

    if ($newName !== null && $newName !== '' && $newName !== $target['username']) {
        $newName = trim($newName);
        if (strlen($newName) < 3) jsonError('El nombre debe tener al menos 3 caracteres');
        if (!preg_match('/^[a-zA-Z0-9_-]+$/', $newName)) {
            jsonError('Nombre de usuario inválido');
        }
        $dup = findUser($newName);
        if ($dup && $dup['id'] !== $targetId) jsonError('Ya existe un usuario con ese nombre');

        $oldPath = getUserConfigPath($target['username']);
        $target['username'] = $newName;
        $newPath = getUserConfigPath($newName);
        if (file_exists($oldPath)) rename($oldPath, $newPath);

        if (isset($_SESSION['username']) && $_SESSION['username'] !== $newName) {
            $_SESSION['username'] = $newName;
        }
    }

    $target['updated_at'] = date('c');
    saveUsers($users);

    jsonResponse([
        'ok'   => true,
        'user' => [
            'id'         => $target['id'],
            'username'   => $target['username'],
            'role'       => $target['role'],
            'created_at' => $target['created_at'],
            'updated_at' => $target['updated_at']
        ]
    ]);
}

/* ---------- DELETE: eliminar usuario ---------- */
if ($method === 'DELETE') {
    $admin = requireAdmin();
    $targetId = $_GET['id'] ?? '';
    if ($targetId === '') jsonError('ID de usuario requerido');

    $users = loadUsers();
    $targetIdx = null;
    foreach ($users as $i => $u) {
        if ($u['id'] === $targetId) { $targetIdx = $i; break; }
    }
    if ($targetIdx === null) jsonError('Usuario no encontrado', 404);

    if ($users[$targetIdx]['id'] === $admin['id']) {
        jsonError('No podés eliminar tu propio usuario');
    }

    $removed = array_splice($users, $targetIdx, 1)[0];
    saveUsers($users);

    $cfgPath = getUserConfigPath($removed['username']);
    if (file_exists($cfgPath)) unlink($cfgPath);

    jsonResponse(['ok' => true, 'deleted' => $removed['username']]);
}

jsonError('Acción no válida');
