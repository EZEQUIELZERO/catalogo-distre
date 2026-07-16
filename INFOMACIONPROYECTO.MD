`catalog.html` debe estar en la **raíz** del repositorio para que las rutas relativas (`data/custom-products.json`, `images/uploads/...`) funcionen tal cual.

## Publicar el sitio (GitHub Pages)

1. Repo → **Settings → Pages**.
2. En "Source" elegí la rama (`main`) y la carpeta `/ (root)`.
3. Guardar. El sitio queda accesible en `https://usuario.github.io/nombre-repo/catalog.html` (o en la raíz si el repo se llama `usuario.github.io`).

## Actualizar el sitio con git (cambios de código)

Para cualquier cambio "estructural" (diseño, funciones nuevas, corregir un bug, etc.) se edita `catalog.html` y se sube por git:

```bash
git clone https://github.com/usuario/nombre-repo.git
cd nombre-repo

# ... editar catalog.html ...

git add catalog.html
git commit -m "Descripción del cambio"
git push origin main
```

GitHub Pages reconstruye el sitio automáticamente entre 30 segundos y un par de minutos después del push.

## Dos formas de modificar el catálogo

| Qué querés hacer | Cómo se hace |
|---|---|
| Cambiar diseño, agregar una función nueva, corregir un bug | Editar `catalog.html` a mano y hacer `git push` |
| Agregar/editar productos, precios, imágenes del día a día | Panel de administración (sin tocar código, sin git) |

## Panel de administración

Se abre con el ícono ⚙️ arriba a la derecha del catálogo.

- **Usuario:** `admin`
- **Contraseña:** `editor2026`

> Esto es una traba simple del lado del cliente (JavaScript), no seguridad real: cualquiera que abra el código fuente puede verla. Sirve para evitar ediciones accidentales, no para proteger datos sensibles.

### Secciones del panel

**General**
- Número de WhatsApp del negocio.
- Configuración de GitHub (repositorio, rama y token) — necesaria para "Agregar producto" e "Importar CSV".

**Productos**
- Habilitar/deshabilitar cada producto (deja de verse en el catálogo).
- Editar el precio.
- Separado por pestaña (Distre / ALGABO).

**Agregar producto**
- Carga un producto nuevo: EAN, descripción, precio, pestaña, categoría, e imagen (URL o archivo).
- Se guarda directamente en el repositorio de GitHub (ver siguiente sección).

**Importar CSV**
- Carga muchos productos de una vez desde un archivo CSV con columnas `CODIGO EAN, DESCRIPCION, PRECIO, URL DE LA IMAGEN` (encabezado en la primera fila).

## Conectar el panel con GitHub (se hace una sola vez)

"Agregar producto" e "Importar CSV" no usan `git push`: escriben directamente en el repositorio a través de la API de GitHub, desde el navegador. Para habilitarlo:

1. En GitHub: **Settings → Developer settings → Fine-grained tokens → Generate new token**.
2. Elegir que el token tenga acceso **solo a este repositorio** (no a todos).
3. Permisos: **Contents → Read and write**. Ningún otro permiso.
4. Copiar el token generado (empieza con `github_pat_...`).
5. En el panel admin → **General**, completar repositorio (`usuario/nombre-repo`), rama (`main`) y el token → **Guardar**.

⚠️ **Ese token da permiso de escritura sobre el repositorio.** Queda guardado únicamente en el navegador donde se cargó (localStorage). No compartir el archivo/token ni usarlo en una computadora que no sea de confianza. Si se filtra, se revoca al instante desde GitHub (Settings → Developer settings → Fine-grained tokens → Revoke).

## Qué se guarda y dónde

| Dato | Dónde vive | Quién lo ve |
|---|---|---|
| Precio editado / producto habilitado-deshabilitado | `localStorage` del navegador | Solo quien lo edita, en ese navegador |
| Número de WhatsApp (editado desde el panel) | `localStorage` del navegador | Solo quien lo edita, en ese navegador |
| Carrito de compras del cliente | `localStorage` del navegador | Solo ese cliente |
| Productos agregados / importados por CSV | `data/custom-products.json` en GitHub | Todos los visitantes del sitio |
| Imágenes subidas desde el panel | `images/uploads/` en GitHub | Todos los visitantes del sitio |
| Catálogo base (productos originales del CSV) | Dentro de `catalog.html` | Todos los visitantes del sitio |

En otras palabras: los cambios de precio/habilitado y el WhatsApp son **por navegador** (no se sincronizan solos entre dispositivos). Los productos nuevos e imágenes sí quedan en GitHub y se ven para todo el mundo.

## Carrito y pedidos por WhatsApp

El cliente arma su pedido con los botones "Agregar"/"Quitar" en cada producto, y lo envía desde el botón verde "Carrito" arriba a la derecha. El mensaje de WhatsApp se genera con el formato:
