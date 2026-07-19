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
└── images/
    └── uploads/                  Imágenes de productos subidas via admin (GitHub API)
```

## Resumen técnico

- **Hosting**: GitHub Pages (estático, sin backend)
- **Persistencia config**: localStorage (por navegador) — precios, visibilidad, WhatsApp
- **Persistencia productos**: GitHub Contents API — productos custom e imágenes
- **Admin**: Panel con login simple (admin/editor2026), sección General, Productos, Agregar producto, Pestañas, Importar CSV
- **Pestañas**: Sistema dinámico con TAB_REGISTRY — distre, algabo, y personalizadas
- **Filtros**: Categoría + subcategoría dependiente, búsqueda por nombre/EAN

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
