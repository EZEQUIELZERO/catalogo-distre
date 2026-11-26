# Conectar el Catálogo Distre con Google Sheets (`CATALOGO-DISTRE-BASE`)

Seguí estos pasos una sola vez para habilitar **Clientes, Cuentas Corrientes, Ventas y Movimientos de Stock** desde el modo Administrador de la web:

## 1. Pegar el script en la planilla
1. Abrí tu planilla **CATALOGO-DISTRE-BASE** en Google Sheets.
2. En el menú superior entrá a **Extensiones → Apps Script**.
3. Borrá el contenido que viene por defecto en `Código.gs` y pegá todo el contenido del archivo [`Code.gs`](./Code.gs).
4. En la línea 12 de `Code.gs`, cambiá `'CAMBIAR_POR_TU_CLAVE_SECRETA'` por una clave propia (por ejemplo `'Distre2026Clave'`). Recordala porque la vas a pegar en el panel Admin.
5. Guardá con **Ctrl + S**.

## 2. Preparar las hojas y columnas de Cuenta Corriente
1. En el editor de Apps Script, arriba donde dice la función a ejecutar, elegí **`setupSheets`** y tocá **Ejecutar**.
   *(También lo podés ejecutar luego desde la planilla en el nuevo menú **⚙️ Distre → Preparar hojas y cuentas corrientes**, o desde el botón **Preparar hojas** del panel Admin.)*
2. Google te va a pedir autorizar permisos la primera vez:
   - Tocá **Revisar permisos** → elegí tu cuenta de Google → **Configuración avanzada** → **Ir a ... (no seguro)** → **Permitir**.
3. Al finalizar, vas a ver creadas automáticamente las hojas:
   - **`CLIENTES`**: mantiene tus columnas `A..Q` intactas y agrega en `R..U` las columnas automáticas **`TOTAL VENTAS`**, **`TOTAL COBROS`**, **`DEUDA / SALDO`** y **`ESTADO`**.
   - **`VENTAS`**: encabezado de cada venta (`ID_VENTA`, fecha, catálogo, cliente, total, pagado, saldo, condición, medio de pago, estado).
   - **`VENTAS_DETALLE`**: detalle de cada producto vendido.
   - **`COBROS`**: pagos totales, parciales y cobranzas de cuenta corriente.
   - **`MOVIMIENTOS_STOCK`**: historial automático de bajas de stock por cada venta cerrada como Admin.
   - **`STOCK_ACTUAL`**: stock vinculado desde el catálogo **EN STOCK**.

## 3. Publicar como Aplicación Web
1. Arriba a la derecha del editor de Apps Script tocá **Implementar → Nueva implementación**.
2. En el ícono de engranaje (**Seleccionar tipo**), elegí **Aplicación web**.
3. Configurá:
   - **Ejecutar como**: **Yo** (tu usuario).
   - **Quién tiene acceso**: **Cualquier persona** *(los datos igual quedan protegidos por tu clave secreta `API_KEY` y solo aparecen en la web si estás logueado como Admin)*.
4. Tocá **Implementar** y copiá la **URL de la aplicación web** (termina en `/exec`).

## 4. Conectar en la web del Catálogo
1. Entrá a tu catálogo web, abrí el icono ⚙️ e iniciá sesión como **Admin**.
2. En **General → Conexión con Google Sheets (Clientes y Ventas)**:
   - Pegá la **URL del Web App (`.../exec`)**.
   - Pegá tu **Clave secreta** (`API_KEY`).
   - Tocá **Guardar conexión** y luego **Probar conexión**.
3. Opcional: tocá **Sincronizar stock EN STOCK → Sheets** cuando quieras subir una foto completa de tu hoja `STOCK_ACTUAL`.

---

> **Importante si editás `Code.gs` en el futuro:** cada vez que cambies el código en Apps Script tenés que ir a **Implementar → Administrar implementaciones → Editar (lápiz) → Nueva versión → Implementar** para que la URL use los cambios nuevos.
