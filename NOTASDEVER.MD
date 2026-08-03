# NOTAS DE VER - Catálogo Distre

Registro de versiones y cambios del proyecto.

---

## Estructura del proyecto

```
catalogo-distre/
├── index.html                    Archivo principal (HTML + CSS + JS inline)
├── INFOMACIONPROYECTO.MD         Documentación de deploy y uso
├── NOTASDEVER.MD                 Este archivo (historial de cambios)
├── data/
│   ├── custom-products.json      Productos agregados via panel admin (GitHub API)
│   └── custom-tabs.json          Pestañas/marcas personalizadas (GitHub API)
├── images/
│   ├── FONDOHTML.webp              Fondo de pantalla optimizado (parallax)
│   └── uploads/                  Imágenes de productos subidas via admin (GitHub API)
```

## Resumen técnico

- **Hosting**: GitHub Pages (estático, sin backend)
- **Persistencia config**: localStorage (por navegador) — precios, visibilidad, WhatsApp
- **Persistencia productos**: GitHub Contents API — productos custom e imágenes
- **Admin**: Panel con login simple (admin/editor2026), sección General, Productos, Agregar producto, Pestañas, Importar CSV
- **Pestañas**: Sistema dinámico con TAB_REGISTRY — distre, algabo, y personalizadas
- **Filtros**: Categoría + subcategoría dependiente, búsqueda por nombre/EAN
- **Admin page**: El panel de administración es una página completa (no popup) con menú lateral y área de contenido amplia

---

## CAMBIOS

### #001 - Subida inicial del proyecto
Primer commit con archivos base del catálogo. Productos hardcodeados directamente en el
HTML como arrays JS (PRODUCTS_DISTRE, PRODUCTS_ALGABO). Estilo dark theme con CSS variables.
Archivos: index.html (catálogo completo con ~200 productos inline)

### #002 - V1.1: Actualizaciones de producto y estilos
Corrección de URLs de imágenes de productos rotas, ajustes en datos de contacto del
footer, y mejoras generales de presentación.
Archivos: index.html (imágenes, footer, estilos)

### #003 - Agregar pestaña SAPHIRUS y modal de productos
Se agregó una tercera pestaña de marca (SAPHIRUS) al catálogo y se implementó un
modal para agregar productos al catálogo.
Archivos: index.html (pestañas HTML, modal de producto)

### #004 - Crear script.js con lógica del catálogo
Se extrajo toda la lógica JavaScript del catálogo a un archivo separado para mejor
organización. Incluía filtros, búsqueda, carrito y modales.
Archivos: script.js (lógica del catálogo completa)

### #005 - Sistema de usuarios con PHP backend
Implementación de backend PHP con autenticación de usuarios y roles admin/usuario.
Archivos: api/auth.php, api/users.php, api/config.php, api/products.php,
api/user-config.php, api/upload.php

### #006 - Mejora de manejo de errores y protección de directorios
Agregado de archivos .htaccess para proteger directorios sensibles y mejorar el
manejo de errores en los endpoints de API.
Archivos: .htaccess (raíz + api/), api/*.php (manejo de errores mejorado)

### #007 - Productos admin + importar CSV
Panel de administración completo para agregar y editar productos con precios,
visibilidad, y funcionalidad de importación masiva desde archivos CSV.
Archivos: index.html, script.js (panel admin, CRUD productos, parser CSV)

### #008 - Migración a GitHub Pages (eliminación de PHP)
Migración completa de hosting PHP a GitHub Pages (estático). Se eliminó todo el
backend PHP (api/*.php, .htaccess, data/, script.js). Se consolidó la aplicación
en un solo archivo index.html. Se usa localStorage para configuración por navegador
y la API de contenidos de GitHub para persistencia de productos custom e imágenes.
Archivos eliminados: api/*.php, .htaccess, data/, script.js
Archivos creados/modificados: index.html (consolidación completa)

### #009 - Agregar productos de prueba via panel admin
Se agregaron productos de prueba desde el panel admin para verificar que la
integración con GitHub API funcionaba correctamente (escritura de productos
e imágenes al repositorio).
Archivos: data/custom-products.json, images/uploads/ (via GitHub API)

### #010 - Botón flotante y modal de presentación de la distribuidora
Se agregó un botón flotante "Conócenos" con un modal que muestra la información
de Distre Patagones: marcas que trabajan (Algabo, Sandra Marzzan, Saphirus),
datos de contacto por WhatsApp y email.
Archivos: index.html (HTML botón + modal, CSS del modal, JS de apertura/cierre)

### #011 - Header no sticky, botón distribuidora reposicionado
El header se cambió de position:sticky a position:relative para que desaparezca
al hacer scroll. El botón de distribuidora se movió de la parte superior a la
esquina inferior derecha y se redujo su tamaño.
Archivos: index.html (CSS header, CSS botón distribuidora posicionamiento)

### #012 - Pestañas dinámicas + subcategorías + gestión de pestañas
Sistema de pestañas completamente dinámico con TAB_REGISTRY. Las pestañas ya no
están hardcodeadas en HTML sino que se renderizan desde datos. Nuevo admin section
"Pestañas" con CRUD completo (crear/renombrar/eliminar) persistido en GitHub API
(data/custom-tabs.json). Campo subcategoría agregado al modelo de productos con
sistema de filtros chips dependientes (al elegir categoría aparecen sus subcategorías).
El selector de pestaña en los formularios admin (Agregar producto, Importar CSV)
ahora se genera dinámicamente.
Archivos: index.html (TAB_REGISTRY, renderTabs, renderAdminTabList,
buildSubfilters, select dinámicos, data/custom-tabs.json)

### #013 - Todas las pestañas editables/eliminables
Se removió la restricción builtIn de las pestañas Distre y ALGABO. Ahora todas las
pestañas se pueden renombrar y eliminar desde el panel admin, igual que las
personalizadas. Se agregó protección para evitar eliminar la última pestaña restante.
Archivos: index.html (renderAdminTabList sin distinción builtIn, TAB_REGISTRY
sin propiedad builtIn, handlers rename/delete universales)

### #014 - Crear NOTASDEVER.MD con estructura y historial
Se creó el archivo de notas de versión con la estructura completa del proyecto,
resumen técnico y el historial detallado de los 13 cambios anteriores numerados
desde #001. Cada entry incluye descripción del cambio y archivos afectados.
Archivos: NOTASDEVER.MD (nuevo)

### #015 - Editar producto desde el panel admin (solo con sesión admin)
Se agregó un botón "✏ Editar" en cada fila de la sección "Productos" del panel
admin (visible únicamente con la sesión de admin iniciada). Abre un modal para
modificar todos los valores del producto: descripción, precio, marca, pestaña,
categoría, subcategoría e imagen (URL o archivo). El EAN se mantiene fijo como
identificador. Los cambios se guardan en el repositorio via GitHub API
(data/custom-products.json) y se aplican para todos los visitantes. Al editar un
producto del catálogo base, se crea una entrada custom que lo sobrescribe al cargar.
Se mejoró mergeCustomProductLocally para remover el producto de otras pestañas
cuando se cambia de pestaña, evitando duplicados.
Archivos: index.html (modal #editOverlay, openEditProductModal,
saveEditProduct, botón editar en renderAdminList, mergeCustomProductLocally)

### #016 - Fix: error "does not match" al guardar/editar productos en GitHub
Se corrigió el error intermitente `data/custom-products.json does not match <sha>`
(conflicto 409 de la API de contenidos de GitHub) al guardar productos.
Causa: el GET del archivo se hacía sin `cache: 'no-store'`, por lo que el
navegador podía devolver un sha viejo (de antes del guardado anterior) al hacer
ediciones seguidas, y el PUT fallaba. Además no había reintento ante conflictos.
Fix: se agregó `cache: 'no-store'` al fetch de githubGetFile, y se crearon los
helpers `updateCustomProducts` y `updateCustomTabs` que releen los datos frescos
y reintentan (hasta 3 veces) cuando el PUT falla por conflicto de sha. Los 6
puntos de guardado (agregar/editar producto, importar CSV, crear/renombrar/
eliminar pestaña) se refactorizaron para usar estos helpers.
Archivos: index.html (githubGetFile, updateCustomProducts, updateCustomTabs,
addProductBtn, saveEditProduct, importCsvBtn, renderAdminTabList, createTabBtn)

### #017 - Panel admin como página completa + botón habilitar todos + descripción breve
Tres mejoras en el panel de administración y el catálogo:
1. El panel de administración dejó de ser un popup/modal y ahora es una página
   completa a pantalla completa. Se reemplazó el overlay (#adminOverlay) por
   .admin-page con menú de opciones vertical en la sidebar izquierda (General,
   Productos, Agregar producto, Pestañas, Importar CSV) y área de administración
   ancha a la derecha (.admin-main, max-width 1240px). Se agregó botón
   "← Volver al catálogo" y se mantuvo "Cerrar sesión". El admin ya no se cierra
   por click afuera ni ESC.
2. Botón de acceso rápido en la sección Productos (#toggleAllBtn) para habilitar
   o deshabilitar todos los productos del tab activo a la vez. El botón muestra
   "✓ Habilitar todos" o "✕ Deshabilitar todos" según el estado actual del tab.
3. Campo "Descripción breve (opcional)" (desc) en el formulario de Agregar
   producto (#npDesc) y en el modal de Editar producto (#editDesc). La descripción
   se guarda en el repositorio con el producto y se muestra a los visitantes en la
   tarjeta del catálogo (.card-desc, truncada a 2 líneas) y en el modal del
   producto (#modalDesc).
Archivos: index.html (HTML/CSS .admin-page, openAdminPanel, closeAdminPage,
renderAdminList + toggleAllBtn, npDesc/editDesc, mergeCustomProductLocally,
renderGrid .card-desc, modalDesc, NOTASDEVER.MD)

### #018 - Fondo de pantalla con imagen FONDOHTML + efecto parallax
Se agregó la imagen RECURSOS/FONDOHTML.png como fondo de la página web con
movimiento suave al hacer scroll (parallax).
1. Se optimizó la imagen original (PNG 1366x768, ~1.6 MB) a WebP comprimido
   (images/FONDOHTML.webp, ~30 KB) usando Pillow con calidad 80. El original
   se mantiene en la carpeta RECURSOS fuera del repo.
2. Nueva capa fija .bg-parallax (#bgParallax) insertada al inicio de <body> con
   la imagen en background center/cover y z-index:-1. Tiene una capa oscura
   sutil (::after con rgba(15,17,21,.45)) para legibilidad. El background base
   se movió de body a html y body quedó transparente para que la capa negativa
   quede visible (evita el solapamiento por stacking context).
3. Movimiento parallax en JS: listener de scroll pasivo + requestAnimationFrame
   que desplaza la capa con transform: translateY(min(scrollY * 0.3, 110px)),
   factor sutil con tope para no descubrir bordes en scrolls largos.
Archivos: index.html (div #bgParallax, CSS .bg-parallax, html/body background,
updateParallax/requestParallax), images/FONDOHTML.webp (nuevo), NOTASDEVER.MD

### #019 - Estilo de botones con la paleta paletadecoloresbotones.jpeg
Se tomó como referencia la imagen RECURSOS/paletadecoloresbotones.jpeg y se
aplicó su estilo SOLO a los botones (no a otros elementos). La paleta define
tres familias con gradiente vertical (claro arriba → oscuro abajo) y borde
inferior oscuro estilo "chiseled":
1. DORADO (activos/CTA): gradiente #cfbe9d → #c5a669 → #b69250, borde #8a7248,
   texto oscuro con sombra clara. Se aplica a estados activos: .tab-btn.active,
   .chip.active, .chip-sm.active, .admin-subnav-btn.active y al botón de Ingresar
   del login (btn-gold).
2. VERDE (acciones de carrito/WhatsApp): gradiente #73bd89 → #4fa968 → #186732,
   borde #186732, texto blanco. Se aplica a .cart-btn, .btn-whatsapp,
   .cart-mini-btn.add y .pres-btn-wa.
3. GRIS (neutros/cerrar) y OSCURO (fondo): gris #9fa1a1 → #8c8c8c → #717171
   (btn-close, admin-edit-btn, pres-btn-email); oscuro #4a4846 → #3b3a39 →
   #2e2e2e (tab-btn inactivos, chips, qty-btn, tab-action, cart-mini-btn.remove,
   admin-subnav-btn inactivos, distri-btn).
Los botones usan text-shadow para lectura (clara en tonos oscuros, oscura en
tonos claros) y box-shadow inset superior/inferior para el acabado de la paleta.
Se crearon clases utilitarias .btn-gold/.btn-green/.btn-gray/.btn-dark en CSS.
Archivos: index.html (variables --btn-*, clases .btn-gold/.btn-green/.btn-gray/
.btn-dark, estilos de .cart-btn, .tab-btn, .chip, .chip-sm, .tab-action,
.cart-mini-btn, .btn-whatsapp, .btn-close, .admin-edit-btn, .admin-subnav-btn,
.qty-btn, .distri-btn, .pres-btn-wa, .pres-btn-email, loginSubmit),
NOTASDEVER.MD

### #020 - Título "Catálogo" y eliminación de la pestaña "Distre"
1. El título de la página cambió de "Catálogo Distre" a solo "Catálogo":
   <title> y <h1> ahora muestran únicamente "Catálogo" (se quitó el span
   "Distre" del encabezado).
2. Se eliminó por completo la pestaña "Distre":
   - Se borró el array PRODUCTS_DISTRE (25 productos) y su comentario del
     código fuente.
   - Se quitó la entrada `distre` de TAB_REGISTRY; ahora el registro base solo
     contiene la pestaña "algabo".
   - El tab activo por defecto pasó de 'distre' a 'algabo' (let activeTab), y
     los fallbacks de findProductTab y de la eliminación de pestañas ahora
     usan 'algabo'.
Las claves de localStorage con prefijo `distre_*` (configuración de GitHub,
overrides, carrito, WhatsApp) y el nombre del repo en el placeholder del admin
se mantienen porque son internos de la app, no la pestaña ni el título.
Archivos: index.html (title, h1, PRODUCTS_DISTRE eliminado, TAB_REGISTRY,
activeTab, findProductTab, fallback eliminar pestaña), NOTASDEVER.MD

### #021 - Versión 2.0.1 en el pie del catálogo
Se agregó la versión "v2.0.1" en el footer del catálogo, resaltada en dorado
(accent) con la clase .ver para mantener el estilo visual del tema oscuro.
Archivos: index.html (footer, CSS footer .ver), NOTASDEVER.MD
