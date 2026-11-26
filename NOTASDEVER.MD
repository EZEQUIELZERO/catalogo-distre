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

### #022 - Paleta azul y blanca para la pestaña SAPHIRUS
Se implementó un tema de color propio para la pestaña SAPHIRUS: al ingresar a
esa pestaña, toda la página cambia a una paleta azul y blanco (frescura y
calidad), y al salir de ella vuelve al tema oscuro original.
- Nuevo bloque CSS "PALETA SAPHIRUS" con override de variables del tema:
  fondo azul muy claro (#eef4fb), tarjetas blancas (#ffffff), texto azul
  oscuro (#10233a), acento azul (#1a6fd8) y gradientes de botones azules.
  También ajusta header blanco, velo del parallax, bordes de botones activos,
  fondos de imágenes y campos de formulario.
- El tema se activa con el atributo `data-tab-theme="saphirus"` en <html>,
  seteado en setActiveTab() cuando la pestaña activa es 'saphirus' y limpiado
  al cambiar a cualquier otra pestaña. Los selectores usan
  [data-tab-theme="saphirus"] (genéricos) para que el override de variables
  aplique también al fondo base del documento (html).
- La paleta aplica a todo el sitio mientras la pestaña esté activa (incluye
  panel admin y modales), y se restaura el tema oscuro al volver a ALGABO u
  otra pestaña.
Archivos: index.html (CSS PALETA SAPHIRUS, setActiveTab data-tab-theme),
NOTASDEVER.MD

### #023 - Paleta malva y blanco para la pestaña SANDRA MARZZAN
Se implementó un tema de color propio para la pestaña SANDRA MARZZAN con la
paleta extraída del sitio oficial de la marca (https://www.sandramarzzan.com.ar,
revisado el 2026-08-03): al ingresar a esa pestaña, toda la página cambia a una
paleta malva/púrpura y blanco (calidad y distinción de la marca), y al salir de
ella vuelve al tema oscuro original.
- Colores reales del sitio usados: --accent-color #66435a (púrpura principal de
  la marca, botones/footer), --main-background #ffffff (fondo blanco),
  --institutional-background #f7f1f1 (malva claro para fondos),
  --institutional-foreground #5c3b49 (púrpura oscuro para texto).
- Nuevo bloque CSS "PALETA SANDRA MARZZAN" con override de variables del tema:
  fondo malva claro (#f7f1f1), tarjetas blancas (#ffffff), texto púrpura oscuro
  (#5c3b49), acento púrpura (#66435a) y gradientes de botones en tonos malva.
  Ajusta header blanco, velo del parallax, bordes de botones activos, fondos de
  imágenes y campos de formulario (mismo patrón que SAPHIRUS).
- El tema se activa con el atributo `data-tab-theme="sandramarzzan"` en <html>,
  seteado en setActiveTab() mediante el mapa TAB_THEMES
  ({'saphirus':'saphirus','sandra-marzzan':'sandramarzzan'}), lo que hace que
  agregar temas a futuro sea solo sumar una entrada al mapa + un bloque CSS.
Archivos: index.html (CSS PALETA SANDRA MARZZAN, TAB_THEMES en setActiveTab),
NOTASDEVER.MD

### #024 - Paleta azul índigo y blanco para la pestaña ALGABO
Se implementó un tema de color propio para la pestaña ALGABO con la paleta
extraída del sitio oficial de la marca (https://algabo.com, revisado el
2026-08-03): al ingresar a esa pestaña, toda la página cambia a una paleta
azul índigo/blanco con acentos fucsia (identidad de la marca), y al salir de
ella vuelve al tema oscuro original.
- Colores reales del sitio usados: h2 #001b71 (azul índigo, color principal de
  la marca), links #cc3366 (fucsia/magenta), fondo #ffffff, texto #333333.
- Nuevo bloque CSS "PALETA ALGABO" con override de variables del tema: fondo
  azul hielo (#f2f6fc), tarjetas blancas (#ffffff), texto azul marino
  (#12224a), acento índigo (#001b71), gradientes de botones azules y bordes de
  elementos activos en fucsia (#cc3366). Ajusta header blanco, velo del
  parallax, fondos de imágenes y campos de formulario (mismo patrón que
  SAPHIRUS y SANDRA MARZZAN).
- ALGABO es la pestaña inicial del catálogo, así que el tema también se aplica
  al cargar la página: se refactorizó el mapa TAB_THEMES a nivel global y se
  creó la función applyTabTheme() (usa activeTab), llamada tanto en
  setActiveTab() como en init() tras el primer render. Agregar un tema nuevo a
  futuro = entrada en TAB_THEMES + bloque CSS + (si es la inicial) nada más.
Archivos: index.html (CSS PALETA ALGABO, TAB_THEMES global, applyTabTheme,
init applyTabTheme), NOTASDEVER.MD

### #025 - Panel admin: selección múltiple, buscador y borrado masivo de productos
Fecha: 2026-08-06
- Se rediseñó la lista de productos del panel admin (sección Productos):
  cada fila tiene ahora un checkbox de selección individual.
- Nueva barra de herramientas sobre la lista: buscador (filtra por nombre o
  EAN en vivo) + botones "☑ Seleccionar todos" (marca solo los filtrados por
  el buscador) y "☐ Deseleccionar todos".
- Nueva barra de acciones bajo la lista con contador de seleccionados y:
  - "⏻ Deshabilitar seleccionados": pone enabled=false (localStorage
    distre_overrides) solo en los productos marcados; las filas quedan con la
    clase disabled-row y desaparecen del catálogo público.
  - "🗑 Eliminar seleccionados" / "🗑 Eliminar todos": borrado real. Requiere
    GitHub configurado (como Editar): escribe en data/custom-products.json con
    flag deleted:true para cada EAN (los productos base, que viven embebidos
    en index.html, también entran al JSON con deleted:true para que dejen de
    verse para los visitantes). Además marca el override local deleted:true.
  - "Eliminar todos" borra todos los productos de la pestaña activa.
- Mecánica de ocultamiento: getEffective() ahora propaga deleted desde
  overrides; renderGrid, buildFilters, buildSubfilters y renderAdminList
  filtran p.deleted; loadCustomProducts remueve de todas las pestañas los
  EANs con deleted:true del repo (cubre productos base); mergeCustomProductLocally
  ignora entradas deleted; openModal no abre productos eliminados.
- Re-editar un producto eliminado lo resucita: saveEditProduct limpia el flag
  deleted local al guardar.
- CSS: .admin-toolbar, .admin-bulkbar, .admin-sel-count, .admin-sel (checkbox),
  fila seleccionada .sel-row, botón rojo .btn-danger; grid de .admin-row pasa
  a 6 columnas (checkbox + imagen + info + precio + switch + editar).
- Verificado en navegador (login admin): búsqueda BABY filtra 37 productos,
  seleccionar todos marca 37, deseleccionar limpia, deshabilitar seleccionados
  afecta solo a los marcados, eliminar seleccionados/todos (con updateCustomProducts
  mockeado, sin tocar el repo real) deja la lista en 360/0 filas y restaura.
Archivos: index.html (HTML toolbar/bulkbar, CSS, getEffective, renderAdminList,
deleteProductsFromRepo, markDeletedLocally, filtros deleted, saveEditProduct),
NOTASDEVER.MD

### #026 - Fix: valor por defecto del repositorio GitHub en panel admin
Fecha: 2026-11-14
- Causa del error al guardar el token: el campo "Repositorio" (`#ghRepo`)
  mostraba `ezequielzero/catalogo-distre` solo como `placeholder` gris pero su
  valor real quedaba vacío (`""`), por lo que al pegar únicamente el token y
  presionar "Guardar configuración de GitHub" fallaba la validación con
  `Repositorio inválido. Formato: usuario/repositorio`.
- Fix: se agregaron `DEFAULT_GH_REPO` (`ezequielzero/catalogo-distre`) y
  `DEFAULT_GH_BRANCH` (`main`) en `getGithubConfig()` y en el botón de guardado,
  además de limpiar sufijo `.git` y barras finales al pegar una URL completa.
  Se corrigió también la nota del panel de `catalog.html` a `index.html`.
Archivos: index.html, NOTASDEVER.MD

### #027 - Fix: importador CSV compatible con formato Google Sheets (CODIGO_IN, STOCK, IMAGEN base64)
Fecha: 2026-11-14
- El importador CSV solo aceptaba 4 columnas fijas por posición (`CODIGO EAN,
  DESCRIPCION, PRECIO, URL DE LA IMAGEN`), rechazando el CSV exportado de
  Google Sheets (`PROVEEDOR,CODIGO_IN,CODIGO_EAN,DESCRIPCION,PRECIO,STOCK,IMAGEN`).
- Nuevo parser `parseCsvRows` + detección por encabezado (`detectCsvColumns`):
  soporta tanto el formato nuevo como el clásico, BOM UTF-8, delimitador `,` o `;`
  y celdas entrecomilladas (como imágenes `data:image/...;base64,...`).
- Prioriza `CODIGO_EAN` y usa `CODIGO_IN` como respaldo si no hay EAN; guarda
  `codigoInterno`, `stock` y `PROVEEDOR` como `brand`.
Archivos: index.html, NOTASDEVER.MD

### #028 - Fix: mostrar productos re-importados/agregados tras "Eliminar todos"
Fecha: 2026-11-14
- Causa: al usar "Eliminar todos" o "Eliminar seleccionados", `markDeletedLocally`
  guardaba `deleted: true` en `localStorage` (`distre_overrides`). Al volver a
  importar esos mismos EANs por CSV o agregar producto, el JSON en GitHub se
  actualizaba bien pero el flag local `deleted: true` seguía ocultándolos en ese
  navegador.
- Fix: nuevo helper `clearDeletedOverrides(eans)` llamado en `loadCustomProducts()`,
  `importCsvBtn`, `addProductBtn` y `saveEditProduct()` para limpiar el flag
  local `deleted` cuando el producto vuelve a existir.
Archivos: index.html, NOTASDEVER.MD

### #029 - Código discreto de stock (S-100-00XXX) debajo del EAN
Fecha: 2026-11-14
- Nuevo helper `formatStockCode(stock)`: genera el código `S-100-00XXX` con
  los últimos 3 dígitos representando el stock disponible (solo cuando el
  producto tiene `stock` numérico).
- Se muestra debajo del EAN en cada tarjeta (`.card-stock-code`) y en el modal
  de detalle (`#modalStockCodeWrap`).
- El stock no se descuenta ni modifica al agregar/enviar pedidos; solo se
  actualiza con una nueva importación CSV.
Archivos: index.html, NOTASDEVER.MD

### #030 - Persistencia global en GitHub, quitar ultimas-unidades, Personalización y header fijo
Fecha: 2026-11-19
- Persistencia global en GitHub para todos los navegadores:
  - Edición rápida de precio (`.admin-price`), visibilidad individual (`.admin-enabled`),
    `Deshabilitar seleccionados`, `Habilitar/Deshabilitar todos` (`#toggleAllBtn`) y
    WhatsApp (`#saveWhatsapp`) ahora guardan directamente en GitHub (`data/custom-products.json`
    y `data/site-config.json`), con cola secuencial de escritura (`productsWriteQueue`),
    reintentos ante conflicto de SHA, cache-busting (`?t=`) y limpieza de overrides locales
    obsoletos (`clearLocalOverrides`).
  - `buildRepoProductEntry` unifica la construcción/preservación de metadatos (`stock`,
    `estado`, `codigoInterno`, `enabled`, `lists`) también en `saveEditProduct`.
- Eliminación definitiva de `"ultimas-unidades"`:
  - Se removieron las 25 referencias residuales en `lists` dentro de `data/custom-products.json`
    sin alterar ningún producto, y se eliminó `ensureTab` en `index.html` para que listas
    huérfanas no recreen pestañas borradas.
- Personalización y colores por pestaña (`#adminSectionAppearance` -> `data/site-config.json`):
  - Nueva sección `🎨 Personalización` en el panel admin (y acceso directo `🎨 Color`
    en Pestañas) con selector de pestaña, presets rápidos, modo claro/oscuro, 8 color pickers,
    vista previa en vivo y opciones globales (tamaño de grilla, redondeo de tarjetas, fondo
    parallax, opacidad del velo y texto del pie de página).
- Encabezado fijo y compacto (v2.1.0):
  - Se eliminó el título "Catálogo" del header; el buscador EAN quedó inmediatamente al lado
    del botón Carrito y `<header>` pasó a `position: sticky; top: 0` con filas de pestañas y
    filtros con desplazamiento horizontal táctil.
Archivos: index.html, data/custom-products.json, data/site-config.json, NOTASDEVER.MD

### #031 - Botón GUARDAR y cambios pendientes en Admin → Productos
Fecha: 2026-11-20
- Barra fija `#adminSaveBar` en la sección Productos con contador de cambios
  pendientes, botón `↺ Descartar` y botón `💾 GUARDAR` (`#adminSaveProductsBtn`).
- Editar precios, activar/desactivar switches, acciones masivas (`Deshabilitar
  seleccionados`, `Habilitar/Deshabilitar todos`, `Eliminar seleccionados/todos`)
  y el nuevo botón individual `🗑` para quitar un producto ahora acumulan los
  cambios en `pendingProductChanges` con indicadores visuales (`Sin guardar` /
  `Se quitará al guardar` + `↺ Deshacer`) sin escribir en GitHub hasta presionar
  `💾 GUARDAR` (guardado en un único commit).
- Confirmación al salir del panel admin o cerrar sesión si hay cambios pendientes.
Archivos: index.html, NOTASDEVER.MD

### #032 - Input de Stock junto al Precio en panel Admin
Fecha: 2026-11-20
- Se agregó el campo numérico `Stock` (`.admin-stock`) justo al lado de `Precio`
  en cada fila de Admin → Productos (con mini etiquetas `Precio` y `Stock` sobre
  cada input), integrado con `pendingProductChanges`, `Sin guardar` y `💾 GUARDAR`
  para actualizar el código `S-100-00XXX` al guardar en GitHub.
- Se agregó también el campo `Stock (opcional)` junto a `Precio` en los
  formularios de Agregar producto (`#npStock`) y Editar producto (`#editStock`),
  con helper compartido `parseNonNegInt`.
Archivos: index.html, NOTASDEVER.MD

### #033 - Carga rápida de stock con lector de códigos (`📷 Cargar Stock`)
Fecha: 2026-11-21
- Nueva sección `📷 Cargar Stock` (`#adminSectionScanStock`) en el panel Admin.
- Flujo de carga con lector/teclado: escanear EAN o código interno (`findProductByCode`)
  → Enter → escribir cantidad → Enter → establece o suma al stock (`#scanModeSelect`)
  y devuelve el foco al campo de código para el siguiente escaneo. También soporta
  entrada combinada `"CODIGO CANTIDAD"` (`parseScanCodeInput`) y sonido opcional.
- Barra fija `#scanSaveBar` sincronizada con `pendingProductChanges` y `💾 GUARDAR`,
  tarjeta de vista previa del producto encontrado (`#scanProductCard`) e historial
  de sesión (`#scanLogList`) con botón `↺ Deshacer`.
Archivos: index.html, NOTASDEVER.MD

### #034 - Nuevo formato CSV, campos Bulto/Nombre Catálogo en Admin y compra por Bulto con descuento
Fecha: 2026-11-21
- Nuevo formato CSV compatible con las columnas `PROVEEDOR`, `FAMILIA`, `CODIGO_EAN`
  (incluyendo códigos alfanuméricos como `SP200`), `DESCRIPCION`, `NOMBRE CATALOGO`,
  `PRECIO`, `STOCK`, `IMAGEN`, `BULTO` y `DESCUENTO POR BULTO` (y compatible con
  formatos anteriores o columna A vacía al inicio):
  - `PROVEEDOR` define la pestaña principal del producto (modo `Automático` por defecto
    en `#csvTab`, creando la pestaña en `data/custom-tabs.json` si no existiera).
  - `FAMILIA` define la sub-pestaña/categoría (`cat`) que aparece debajo de las pestañas
    principales.
  - `NOMBRE CATALOGO` (`catalogName`) se muestra como título en las tarjetas y modal
    del catálogo (`getDisplayName`), conservando `DESCRIPCION` (`name`) para búsqueda,
    admin, carrito y pedidos de WhatsApp.
- Paridad completa en **Agregar producto** (`#adminSectionAddProduct`) y **Editar
  producto** (`#editOverlay`): se incorporaron `Código interno`, `Nombre en catálogo`,
  `Bulto (unidades por bulto)`, `Descuento por bulto % (0–100)`, `Marca / Proveedor`
  y etiqueta `Familia / Categoría`; se habilitó código EAN alfanumérico (`SP200`) y
  búsqueda/escáner case-insensitive por EAN, código interno, descripción y nombre catálogo.
- Compra por bulto (`📦 Bulto x CANTIDAD`):
  - Nuevo botón en tarjetas del catálogo, modal de producto y `+Bulto` en el carrito.
  - Aplica descuento configurable del 0 al 100% (`calcCartLine`) sobre las unidades por
    bulto completo cuando `DESCUENTO POR BULTO > 0`; si no tiene valor o es `0`, no
    aplica descuento y agrega el bulto al precio normal.
  - Muestra precio por unidad con descuento en tarjeta y modal, precio tachado y ahorro
    total en el carrito (`#cartSavingsRow`), y desglose de bultos y descuento en el
    mensaje de WhatsApp (`buildOrderMessage`).
Archivos: index.html, NOTASDEVER.MD

### #035 - Envío/exportación del pedido con Descripción completa (`DESCRIPCION | CANTIDAD | PRECIO | TOTAL`)
Fecha: 2026-11-21
- El envío del carrito (`buildOrderData` / `buildOrderMessage`) siempre utiliza la
  **Descripción** completa (`eff.name`, nunca el nombre corto del catálogo) y ordena
  las columnas como **`DESCRIPCION`**, **`CANTIDAD`**, **`PRECIO`**, **`TOTAL`**.
- Nuevas acciones de exportación en `#cartOverlay` junto a **Enviar pedido por WhatsApp**:
  - **📊 Descargar Excel (`#exportExcelBtn`)**: generador OOXML `.xlsx` puro en JS
    (`buildOrderXlsxBytes` / `buildZipBytes`) con hoja `Pedido`, columnas formateadas,
    descuento por bulto y total.
  - **📋 Copiar para Sheets (`#copySheetsBtn`)**: copia TSV (`buildOrderTsv`) en
    4 columnas para pegar directo en Google Sheets.
  - **📄 Descargar PDF (`#exportPdfBtn`)**: generador PDF 1.4 puro en JS
    (`buildOrderPdfBytes`) en tamaño A4 con codificación WinAnsi para acentos/ñ,
    ajuste de líneas y paginación automática.
Archivos: index.html, NOTASDEVER.MD

### #036 - Edición directa de Descripción (sistema) y Catálogo (tarjeta) en Admin → Productos
Fecha: 2026-11-21
- En **Admin → Productos** (`renderAdminList`), cada fila ahora incluye inputs editables en línea para **Descripción (sistema / pedidos)** (`.admin-prod-name`) y **Catálogo (tarjeta)** (`.admin-prod-catalog`), integrados con `pendingProductChanges`, el indicador `Sin guardar` y el guardado en lote con `💾 GUARDAR`.
- `openEditProductModal` refleja también las ediciones en línea pendientes al abrir `#editOverlay`.
- Etiquetas unificadas y claras en **Agregar producto**, **Editar producto** y lista Admin distinguiendo `Descripción (sistema / pedidos — WhatsApp, Excel, Sheets, PDF)`, `Nombre en catálogo (como aparece en la tarjeta, opcional)` y `Nota en tarjeta (opcional)`, además de alias CSV adicionales (`DESCRIPCION_SISTEMA`, `NOMBRE_DEL_CATALOGO`).
Archivos: index.html, NOTASDEVER.MD

### #037 - Doble catálogo independiente (COMPLETO / EN STOCK)
Fecha: 2026-11-24
- Se duplicó la estructura de catálogo en dos catálogos independientes accesibles desde la barra superior (`#catalogSwitchRow`, soporta `?catalogo=stock` / `#stock`):
  - **📚 COMPLETO** (`completo`): catálogo principal completo (`data/custom-products.json` + productos embebidos `PRODUCTS_ALGABO`), con clave de almacenamiento `distre_overrides` y `distre_cart`.
  - **✅ EN STOCK** (`stock`): catálogo secundario inicializado vacío (`data/stock-products.json`) para cargar solo productos en stock, sin mezclar los productos embebidos, con claves independientes `distre_overrides_stock` y `distre_cart_stock`.
- Ambas vistas comparten exactamente las mismas pestañas de marca (`ALGABO`, `SANDRA MARZZAN`, `SAPHIRUS`, `AMBAR`, `DESODORANTES`, `VAIS` y pestañas personalizadas) y sub-pestañas de familia (`#filters`, `#subfilters`), además de todas las funciones de precios, bulto con descuento, código interno de stock (`S-100-...`) y exportación de pedidos (`WhatsApp`, `Excel`, `Sheets`, `PDF`, indicando catálogo en título y nombre de archivo).
- En **Admin** se agregó la barra fija `#adminCatalogBar` (`📚 COMPLETO` / `✅ EN STOCK`) y selectores en **Agregar producto** (`#npCatalog`) e **Importar CSV** (`#csvCatalog`), más badge de catálogo activo en **Productos**, **📷 Cargar Stock** y **Editar producto** (`#editCatalogBadge`), con confirmación para no perder ediciones pendientes al cambiar de catálogo.
- La subida de imágenes desde admin prefija `stock-` cuando el destino es `EN STOCK` y consulta `githubGetFile` para respetar `sha` previo.
Archivos: index.html, data/stock-products.json, NOTASDEVER.MD

### #038 - Ocultar sin stock en EN STOCK, filtro categoría/subcategoría en Admin y alta rápida en escáner
Fecha: 2026-11-26
- **Visibilidad por stock solo en `EN STOCK`**:
  - Nuevos helpers `hasPositiveStock` e `isVisibleInCatalog`: en el catálogo público `EN STOCK`, los productos con `stock` vacío (`null`/`undefined`) o `0` quedan ocultos automáticamente en tarjetas, contadores (`getCatalogTotalCount`), filtros (`buildFilters`, `buildSubfilters`), búsquedas y modal (`openModal`), mientras que en `COMPLETO` se siguen mostrando normalmente.
  - En **Admin → Productos** y **📷 Cargar Stock** siguen visibles para poder cargarles stock; en `EN STOCK` muestran la etiqueta `Sin stock (oculto en EN STOCK)`.
- **Búsqueda y filtro por categoría y subcategoría en Admin → Productos**:
  - Agregados los selectores `#adminCatFilter` y `#adminSubcatFilter` en `.admin-toolbar` (`populateAdminCategoryFilters`), con actualización en cascada y reseteo al cambiar de pestaña o catálogo (`setActiveTab`, `setActiveCatalog`).
  - La búsqueda por texto (`matchesAdminProduct`) también busca por nombre de categoría y subcategoría, y cada fila muestra su categoría/subcategoría en `.p-ean`.
- **Alta rápida desde escáner si el código no existe**:
  - Al escanear un código inexistente en **📷 Cargar Stock**, aparece `#scanNotFoundCard` con la opción **➕ Cargar producto ahora** (`#scanQuickAddBox`) que precarga el EAN y la cantidad escaneada (`CODIGO CANTIDAD`).
  - Si el código ya existe en el otro catálogo (por ejemplo en `COMPLETO` mientras se escanea en `EN STOCK`), ofrece además el botón **📋 Cargar con datos de ...** para precargar nombre, precio, pestaña, categoría, subcategoría, bulto, descuento e imagen y guardar directo en GitHub.
Archivos: index.html, NOTASDEVER.MD

### #039 - Clientes, Cuentas Corrientes, Ventas Admin en Google Sheets y descuento en EN STOCK
Fecha: 2026-11-26
- **Backend Apps Script (`apps-script/Code.gs`, `apps-script/INSTRUCCIONES.md`)**:
  - Web App para pegar en **CATALOGO-DISTRE-BASE** (`Extensiones → Apps Script`) protegido con clave secreta (`API_KEY`).
  - Mantiene intactas las columnas `A..Q` de `CLIENTES`, agrega columnas automáticas de cuenta corriente (`TOTAL VENTAS`, `TOTAL COBROS`, `DEUDA / SALDO`, `ESTADO` en `R..U`) con fórmulas y crea/administra las hojas `VENTAS`, `VENTAS_DETALLE`, `COBROS`, `MOVIMIENTOS_STOCK` y `STOCK_ACTUAL` (ignorando filas en blanco previas a la fila suelta `BAHIA BLANCA` al insertar clientes).
- **Gestión de Clientes y Cuentas Corrientes (solo Admin)**:
  - Nueva configuración en **Admin → General** (`#sheetsApiUrl`, `#sheetsApiKey`, probar conexión, preparar hojas/fórmulas y sincronizar snapshot de `EN STOCK` a `STOCK_ACTUAL`).
  - Nueva sección **👥 Clientes** (`#adminSectionClients`) con KPIs (`Total clientes`, `Con deuda`, `Deuda total`), búsqueda, filtro por estado de cuenta, creación de clientes (`#clientFormOverlay`) y ficha de cuenta corriente (`#clientDetailOverlay`) con historial de ventas/cobros y registro de cobros parciales o totales.
- **Cerrar venta desde el Carrito (solo Admin) y descuento exclusivo en `EN STOCK`**:
  - Cuando el administrador está logueado (`isAdmin`), el encabezado muestra `👤 Admin` (`#adminLoggedPill`) y el carrito muestra `#cartAdminSaleBox` para seleccionar o crear un cliente, ver su deuda actual, elegir condición (`Cuenta corriente`, `Pago total`, `Pago parcial`), medio de pago y cerrar la venta en Google Sheets.
  - Al cerrar la venta como Admin (con la casilla `#saleDeductStock` activa), descuenta las cantidades vendidas **únicamente del catálogo `EN STOCK`** (`data/stock-products.json`), dejando intacto el catálogo `COMPLETO` y registrando cada baja en `MOVIMIENTOS_STOCK` / `STOCK_ACTUAL`. Los visitantes no logueados como Admin no ven estas opciones ni se descuenta stock al usar el carrito.
Archivos: apps-script/Code.gs, apps-script/INSTRUCCIONES.md, index.html, NOTASDEVER.MD

### #040 - Módulo Depósito (solo Admin): armado con escáner/catálogo, ajuste de stock, remito A4 personalizable y entrega/cobro
Fecha: 2026-11-26
- **Backend Google Apps Script (`apps-script/Code.gs`)**:
  - Se ampliaron `VENTAS` (`ESTADO_DEPOSITO`, `FECHA_ARMADO`, `FECHA_ENTREGA`, `FECHA_COBRO_ACORDADA`, `DEVOLUCIONES_JSON`, `TOTAL_DEVOLUCIONES`) y `VENTAS_DETALLE` (`CANT_PEDIDA`, `CANT_ARMADA`, `CANT_DESCONTADA`) conservando compatibilidad con las columnas `A..N` y fórmulas existentes de cuenta corriente.
  - Nuevas acciones: `getOrders`, `saveOrderPacking` (guardado parcial `EN_ESPERA` o finalizado `LISTO` con movimientos `AJUSTE_ARMADO_MAS` / `DEVOLUCION_ARMADO`), `confirmDelivery` (confirma entrega y cobro total/parcial/fecha acordada) y `reopenOrderToPacking`.
- **Panel Admin → `🏭 Depósito` (`#adminSectionDeposito`)**:
  - Sub-pestañas **📦 Para armar**, **✅ Pedidos listos** y **🚚 Entregados** con búsqueda en vivo y alertas de fecha de cobro vencida.
  - **Mesa de armado comparativa**: barra de progreso, tabla Pedido vs. Armado, botones `−`/`+`/`=`, sección **DEVUELVE** (devoluciones/notas de crédito que restan en `TOTAL QUEDA ENTONCES`) y vista previa en vivo de cambios en `EN STOCK`.
  - **Herramientas de armado**: lector EAN / código interno (`CODIGO` + Enter + cantidad + Enter, o `CODIGO CANTIDAD`), menú desplegable del catálogo con buscador, y alta rápida de productos nuevos en `EN STOCK` directamente al pedido (`#depQuickAddBox` compartiendo `createAndSaveProduct`).
  - **Ajuste bidireccional automático en `EN STOCK`**: si se arma menos cantidad que la descontada originalmente (`10 → 8`), devuelve la diferencia al stock (`+2`); si se arma más o se agregan productos, descuenta el excedente (`computePackingStockDeltas` / `applyEnStockAdjustments`), sin tocar `COMPLETO`.
- **Remito personalizable A4 / ½ A4 (`#remitoPreviewOverlay`, `#remitoConfigOverlay`)**:
  - Formato con cabecera de cliente + total de artículos, tabla `PRODUCTO | UD | PRECIO | TOTAL`, fila `TOTAL DE ARTICULOS` y bloque `DEVUELVE` / `TOTAL QUEDA ENTONCES`.
  - Ajuste automático a **½ Hoja A4** (hasta 15 líneas), **½ A4 duplicado** (2 copias en 1 A4) u **Hoja A4 completa / multipágina**, además de configuración persistente de títulos, colores, tamaño de letra, firma, EAN y línea de corte (`siteConfig.remito`).
- **Confirmación de entrega y cobro (`#deliveryOverlay`)**:
  - Al entregar un pedido listo, permite registrar pago total, cobro parcial con fecha acordada para el saldo o cuenta corriente con fecha acordada, impactando en `COBROS`, `VENTAS` y el saldo del cliente.
Archivos: apps-script/Code.gs, apps-script/INSTRUCCIONES.md, index.html, NOTASDEVER.MD

### #041 - Fix bloqueo al ejecutar `setupSheets` en Google Apps Script
Fecha: 2026-11-26
- **Eliminación de bloqueo por alerta UI en `setupSheets()`**:
  - Al ejecutar `setupSheets` desde el editor de Apps Script, `SpreadsheetApp.getUi().alert(...)` abría un diálogo modal oculto en la pestaña de la planilla esperando confirmación y dejaba la ejecución "cargando" indefinidamente. Se quitó el `alert()` de `setupSheets()` (ahora registra con `Logger.log`) y se movió a `setupSheetsFromMenu()`, usado únicamente por el menú `⚙️ Distre`.
- **Escritura en lote de fórmulas y códigos en `ensureSheets_()`**:
  - Reemplazado el bucle fila-por-fila por un único `setFormulas(formulasGrid)`, `setNumberFormat('$ #,##0')` y `setValues(colAValues)` (solo si faltan códigos), reduciendo cientos de llamadas RPC a 2–3 operaciones rápidas.
- **Ampliación automática de columnas**:
  - `ensureAdminSheet_` y `ensureSheets_` amplían automáticamente columnas (`insertColumnsAfter`) si la hoja tiene menos columnas que los encabezados requeridos (`20` para `VENTAS` o `21` para `CLIENTES` con cuentas corrientes `R..U`).
Archivos: apps-script/Code.gs, NOTASDEVER.MD

### #042 - Remito: mínimo ½ Hoja A4 con líneas en blanco, 25 productos por media página y salto automático a A4 / Multipágina
Fecha: 2026-11-26
- **Tamaño mínimo garantizado de ½ Hoja A4 (`138mm`)**:
  - Incluso cuando el pedido tiene 1 solo producto, `.remito-card` / `.remito-half-box` mantienen una altura mínima de `138mm` (`½ Hoja A4`) y rellenan con filas en blanco delimitadas por bordes suaves (`remito-blank-row`) hasta completar el cuadro antes de `TOTAL DE ARTICULOS`.
- **Capacidad de al menos 25 productos en ½ Hoja A4**:
  - Se calibró la tipografía e interlineado de impresión/vista previa para que hasta `REMITO_HALF_MAX_ITEMS = 25` ítems entren cómodamente dentro de `138mm`.
- **Escalado automático a Hoja A4 completa y Multipágina**:
  - `resolveRemitoMode`: hasta `25` ítems usa **½ Hoja A4** (`half`); desde `26` ítems pasa automáticamente a **Hoja A4 completa** (`full`, rellenando hasta 1 página hasta `54` ítems) y al superar `REMITO_FULL_MAX_ITEMS = 54` fluye automáticamente en **A4 Multipágina** sin filas de relleno y repitiendo el encabezado `thead` en cada página.
- **Vista previa fiel a hoja A4**:
  - `.remito-preview-frame` / `.remito-preview-sheet` muestran la proporción real de A4 / ½ A4 y la insignia `#remitoLayoutBadge` indica cantidad de productos y páginas estimadas.
Archivos: index.html, NOTASDEVER.MD

### #043 - Exportar productos cargados a Excel (.xlsx) con el mismo formato de carga
Fecha: 2026-11-26
- **Exportación directa a `.xlsx` compatible 1:1 con `Importar CSV` / Google Sheets (`CATALOGO_WEB`)**:
  - Columnas exportadas en orden exacto: `PROVEEDOR`, `FAMILIA`, `CODIGO_EAN`, `DESCRIPCION`, `NOMBRE CATALOGO`, `PRECIO`, `STOCK`, `IMAGEN`, `BULTO`, `DESCUENTO POR BULTO`, `SUBCATEGORIA`, `CODIGO_INTERNO`.
  - Los códigos EAN y texto se escriben como `inlineStr` (evita notación científica en Excel), mientras que `PRECIO`, `STOCK`, `BULTO` y `DESCUENTO POR BULTO` conservan formato numérico real (y celdas vacías cuando no tienen valor). Incluye fila de encabezado fija (`ySplit="1"`) y autofiltro Excel (`autoFilter`).
- **Alcances configurables en Admin**:
  - En **Admin → Productos** (`#adminExportScope` + `#adminExportExcelBtn`): permite exportar **Todo el catálogo activo**, **Solo pestaña actual**, **Solo vista filtrada** o **Solo seleccionados**, reflejando incluso cambios pendientes en pantalla y omitiendo los marcados para eliminar.
  - En **Admin → Importar CSV** (`#csvExportExcelBtn`): exporta según el **Catálogo destino** (`#csvCatalog`) y la **Pestaña destino** (`#csvTab`), sirviendo también como plantilla editable para volver a subir cambios.
Archivos: index.html, NOTASDEVER.MD

### #044 - Cancelación de pedidos con devolución de stock y refuerzo de devolución de sobrantes en EN STOCK
Fecha: 2026-11-26
- **Backend Google Apps Script (`apps-script/Code.gs`, `apps-script/INSTRUCCIONES.md`)**:
  - Nueva acción `cancelOrder` (`handleCancelOrder_`): marca la venta como `CANCELADO` (`ESTADO` y `ESTADO_DEPOSITO`), anula montos financieros (`TOTAL = 0`, `SALDO_VENTA = 0`) preservando el total original en `NOTA` para que `CLIENTES` deje de computar la deuda, pone en `0` `CANTIDAD`, `TOTAL`, `CANT_ARMADA` y `CANT_DESCONTADA` en `VENTAS_DETALLE` (evitando doble devolución si se intenta cancelar de nuevo) y registra movimientos positivos `CANCELACION_PEDIDO` en `MOVIMIENTOS_STOCK` / `STOCK_ACTUAL`.
- **Cancelar pedido en Depósito (`index.html`)**:
  - Nueva pestaña **❌ Cancelados** (`#depCountCancelled`) y botón **❌ Cancelar** en tarjetas `PARA_ARMAR`, `EN_ESPERA`, `LISTO` y dentro de la mesa de armado (`#depCancelOrderBtn`).
  - Modal `#cancelOrderOverlay` (`openCancelOrderModal`) con previsualización exacta de unidades que vuelven a `EN STOCK` (`computeCancelStockReturns`), motivo opcional y advertencia si hubo pago previo (queda a favor del cliente).
- **Refuerzo de devolución de sobrantes al armar menos unidades (`EN STOCK`)**:
  - `applyEnStockAdjustments` calcula el nuevo stock sobre el valor vivo leído dentro de `updateCustomProducts` en GitHub (evitando pises ante ediciones concurrentes) y se ejecuta **antes** de confirmar `saveOrderPacking` o `cancelOrder` en Google Sheets.
  - `saveActiveDepOrder` actualiza `cantDescontada` únicamente para productos existentes en `EN STOCK` y `#depStockDeltaBox` detalla explícitamente los sobrantes devueltos (`↩ sobrante devuelve +N a EN STOCK`).
Archivos: apps-script/Code.gs, apps-script/INSTRUCCIONES.md, index.html, NOTASDEVER.MD
