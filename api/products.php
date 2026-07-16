<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ---------- GET: listar productos ---------- */
if ($method === 'GET' && $action === '') {
    $products = loadProducts();
    jsonResponse(['ok' => true, 'products' => $products]);
}

/* ---------- GET: listar por tab ---------- */
if ($method === 'GET' && $action === 'bytab') {
    $tab = $_GET['tab'] ?? '';
    $all = loadProducts();
    $filtered = array_values(array_filter($all, function($p) use ($tab) {
        return $p['tab'] === $tab;
    }));
    jsonResponse(['ok' => true, 'products' => $filtered]);
}

/* ---------- POST: crear producto ---------- */
if ($method === 'POST' && $action === '') {
    requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) jsonError('Datos inválidos');

    $ean  = trim($input['ean'] ?? '');
    $name = trim($input['name'] ?? '');
    $price = isset($input['price']) ? (int)$input['price'] : null;
    $img  = trim($input['img'] ?? '');
    $brand = trim($input['brand'] ?? '');
    $cat  = trim($input['cat'] ?? '');
    $tab  = trim($input['tab'] ?? 'distre');

    if ($ean === '' || $name === '') {
        jsonError('EAN y Descripción son obligatorios');
    }
    if (!in_array($tab, ['distre', 'algabo'])) {
        jsonError('Pestaña inválida');
    }

    $products = loadProducts();
    foreach ($products as $p) {
        if ($p['ean'] === $ean && $p['tab'] === $tab) {
            jsonError('Ya existe un producto con ese EAN en esta pestaña');
        }
    }

    $newProduct = [
        'id'   => bin2hex(random_bytes(8)),
        'ean'  => $ean,
        'name' => $name,
        'price'=> $price,
        'img'  => $img !== '' ? $img : '',
        'brand'=> $brand !== '' ? $brand : 'Sin marca',
        'cat'  => $cat !== '' ? $cat : 'General',
        'tab'  => $tab,
        'created_at' => date('c')
    ];

    $products[] = $newProduct;
    saveProducts($products);

    jsonResponse(['ok' => true, 'product' => $newProduct]);
}

/* ---------- PUT: editar producto ---------- */
if ($method === 'PUT') {
    requireAdmin();
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['id'])) jsonError('Datos inválidos');

    $products = loadProducts();
    $idx = null;
    foreach ($products as $i => $p) {
        if ($p['id'] === $input['id']) { $idx = $i; break; }
    }
    if ($idx === null) jsonError('Producto no encontrado', 404);

    $p = &$products[$idx];
    if (isset($input['name']))  $p['name']  = trim($input['name']);
    if (isset($input['price'])) $p['price'] = (int)$input['price'];
    if (isset($input['img']))   $p['img']   = trim($input['img']);
    if (isset($input['brand'])) $p['brand'] = trim($input['brand']);
    if (isset($input['cat']))   $p['cat']   = trim($input['cat']);
    if (isset($input['ean']))   $p['ean']   = trim($input['ean']);

    saveProducts($products);
    jsonResponse(['ok' => true, 'product' => $p]);
}

/* ---------- DELETE: eliminar producto ---------- */
if ($method === 'DELETE') {
    requireAdmin();
    $id = $_GET['id'] ?? '';
    if ($id === '') jsonError('ID requerido');

    $products = loadProducts();
    $idx = null;
    foreach ($products as $i => $p) {
        if ($p['id'] === $id) { $idx = $i; break; }
    }
    if ($idx === null) jsonError('Producto no encontrado', 404);

    $removed = array_splice($products, $idx, 1)[0];
    saveProducts($products);

    jsonResponse(['ok' => true, 'deleted' => $removed['name']]);
}

jsonError('Acción no válida');
