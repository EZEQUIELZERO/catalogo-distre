<?php
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Método no permitido', 405);
}

requireAdmin();

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    jsonError('No se recibió ningún archivo');
}

$file = $_FILES['image'];
$ean  = trim($_POST['ean'] ?? '');

if ($ean === '') {
    jsonError('Código EAN requerido');
}

$ean = preg_replace('/[^a-zA-Z0-9]/', '_', $ean);

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
if (!in_array($ext, $allowed)) {
    jsonError('Formato no permitido. Usá: JPG, PNG, GIF o WEBP');
}

if ($file['size'] > 5 * 1024 * 1024) {
    jsonError('El archivo no puede superar 5MB');
}

global $IMAGES_DIR;
if (!is_dir($IMAGES_DIR)) @mkdir($IMAGES_DIR, 0755, true);

$filename = $ean . '.' . $ext;
$dest = $IMAGES_DIR . '/' . $filename;

if (!move_uploaded_file($file['tmp_name'], $dest)) {
    jsonError('Error al guardar el archivo. Verificá permisos de la carpeta data/products/images/');
}

$url = 'data/products/images/' . $filename;
jsonResponse(['ok' => true, 'url' => $url, 'filename' => $filename]);
