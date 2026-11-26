/**
 * ============================================================================
 * CATALOGO-DISTRE — Backend Google Apps Script para CATALOGO-DISTRE-BASE
 * ============================================================================
 * Pegar este código en Extensiones -> Apps Script dentro de la planilla
 * CATALOGO-DISTRE-BASE, cambiar DEFAULT_API_KEY (o configurar la propiedad
 * DISTRE_API_KEY), ejecutar "setupSheets" una vez e implementar como
 * Aplicación web (Ejecutar como: Yo | Acceso: Cualquier persona).
 * ============================================================================
 */

const DEFAULT_API_KEY = 'CAMBIAR_POR_TU_CLAVE_SECRETA';

const SHEET_NAMES = {
  CLIENTES: 'CLIENTES',
  VENTAS: 'VENTAS',
  VENTAS_DETALLE: 'VENTAS_DETALLE',
  COBROS: 'COBROS',
  MOVIMIENTOS_STOCK: 'MOVIMIENTOS_STOCK',
  STOCK_ACTUAL: 'STOCK_ACTUAL'
};

const HEADERS = {
  CLIENTES_CTACTE: ['TOTAL VENTAS', 'TOTAL COBROS', 'DEUDA / SALDO', 'ESTADO'],
  VENTAS: [
    'ID_VENTA', 'FECHA', 'CATALOGO', 'COD_CLIENTE', 'CLIENTE',
    'SUBTOTAL', 'DESC_BULTO', 'TOTAL', 'PAGADO', 'SALDO_VENTA',
    'CONDICION', 'MEDIO_PAGO', 'ESTADO', 'NOTA',
    'ESTADO_DEPOSITO', 'FECHA_ARMADO', 'FECHA_ENTREGA',
    'FECHA_COBRO_ACORDADA', 'DEVOLUCIONES_JSON', 'TOTAL_DEVOLUCIONES'
  ],
  VENTAS_DETALLE: [
    'ID_VENTA', 'FECHA', 'CATALOGO', 'EAN', 'DESCRIPCION',
    'CANTIDAD', 'PRECIO_UNIT', 'TOTAL',
    'CANT_PEDIDA', 'CANT_ARMADA', 'CANT_DESCONTADA'
  ],
  COBROS: [
    'ID_COBRO', 'FECHA', 'COD_CLIENTE', 'CLIENTE', 'ID_VENTA',
    'MONTO', 'MEDIO_PAGO', 'NOTA'
  ],
  MOVIMIENTOS_STOCK: [
    'FECHA', 'TIPO', 'REFERENCIA', 'CATALOGO', 'EAN', 'DESCRIPCION',
    'CANTIDAD', 'STOCK_ANTERIOR', 'STOCK_NUEVO', 'CLIENTE'
  ],
  STOCK_ACTUAL: [
    'EAN', 'CODIGO_INTERNO', 'MARCA', 'FAMILIA', 'DESCRIPCION',
    'PRECIO', 'STOCK', 'ACTUALIZADO'
  ]
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('⚙️ Distre')
    .addItem('Preparar hojas y cuentas corrientes', 'setupSheetsFromMenu')
    .addToUi();
}

function getExpectedApiKey_() {
  try {
    const prop = PropertiesService.getScriptProperties().getProperty('DISTRE_API_KEY');
    if (prop && String(prop).trim()) return String(prop).trim();
  } catch (e) {}
  return DEFAULT_API_KEY;
}

function checkAuth_(key) {
  const expected = getExpectedApiKey_();
  const given = String(key || '').trim();
  if (!given || given !== expected) {
    throw new Error('Clave secreta inválida.');
  }
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function round2_(n) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;
}

function toNum_(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  const s = String(v === null || v === undefined ? '' : v).trim().replace(/\$/g, '').replace(/\s+/g, '');
  if (!s) return 0;
  // Normaliza separadores AR si viene formateado como texto
  const normalized = (s.indexOf(',') >= 0 && s.indexOf('.') >= 0)
    ? s.replace(/\./g, '').replace(',', '.')
    : (s.indexOf(',') >= 0 ? s.replace(',', '.') : s);
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatDate_(ss, d) {
  const tz = ss.getSpreadsheetTimeZone() || 'America/Argentina/Buenos_Aires';
  return Utilities.formatDate(d || new Date(), tz, 'dd/MM/yyyy HH:mm');
}

function makeId_(ss, prefix, d) {
  const tz = ss.getSpreadsheetTimeZone() || 'America/Argentina/Buenos_Aires';
  const rand = Math.floor(100 + Math.random() * 900);
  return prefix + '-' + Utilities.formatDate(d || new Date(), tz, 'yyyyMMdd-HHmmss') + '-' + rand;
}

function styleHeaderRow_(sheet, rowNum, colCount, bgHex) {
  const rng = sheet.getRange(rowNum, 1, 1, colCount);
  rng.setFontWeight('bold')
    .setBackground(bgHex || '#1e3a5f')
    .setFontColor('#ffffff');
  if (sheet.getFrozenRows() < rowNum) {
    sheet.setFrozenRows(rowNum);
  }
}

function ensureAdminSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }
  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    styleHeaderRow_(sh, 1, headers.length, '#1e3a5f');
  } else {
    const existing = sh.getRange(1, 1, 1, headers.length).getValues()[0];
    let dirty = false;
    for (let i = 0; i < headers.length; i++) {
      if (!String(existing[i] || '').trim()) {
        dirty = true;
        break;
      }
    }
    if (dirty) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      styleHeaderRow_(sh, 1, headers.length, '#1e3a5f');
    }
  }
  return sh;
}

function findClientsHeaderRow_(sheet) {
  const maxCheck = Math.min(10, Math.max(1, sheet.getLastRow()));
  const vals = sheet.getRange(1, 1, maxCheck, Math.min(17, Math.max(2, sheet.getLastColumn()))).getValues();
  for (let r = 0; r < vals.length; r++) {
    const c0 = String(vals[r][0] || '').trim().toUpperCase();
    const c1 = String(vals[r][1] || '').trim().toUpperCase();
    if (c0 === 'CODIGO' && c1 === 'CLIENTE') return r + 1;
  }
  return 2;
}

function isRealClientRow_(row) {
  const cliente = String(row[1] || '').trim();
  const nombre = String(row[4] || '').trim();
  return !!(cliente || nombre);
}

function findLastClientRow_(sheet, headerRow) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= headerRow) return headerRow;
  const vals = sheet.getRange(1, 1, lastRow, 5).getValues();
  for (let r = vals.length - 1; r >= headerRow; r--) {
    const cod = String(vals[r][0] || '').trim();
    const cli = String(vals[r][1] || '').trim();
    const nom = String(vals[r][4] || '').trim();
    if (cod || cli || nom) return r + 1;
  }
  return headerRow;
}

function getMaxClientCode_(vals, headerRow) {
  let maxCode = 0;
  for (let r = headerRow; r < vals.length; r++) {
    const raw = String(vals[r][0] || '').trim();
    if (/^\d+$/.test(raw)) {
      const n = parseInt(raw, 10);
      if (n > maxCode) maxCode = n;
    }
  }
  return maxCode;
}

function buildClientRowFormulas_(rowNum) {
  const r = rowNum;
  return [
    '=IF(A' + r + '="",0,SUMIF(VENTAS!$D:$D,A' + r + ',VENTAS!$H:$H))',
    '=IF(A' + r + '="",0,SUMIF(COBROS!$C:$C,A' + r + ',COBROS!$F:$F))',
    '=R' + r + '-S' + r,
    '=IF(T' + r + '>0,"CON DEUDA",IF(T' + r + '<0,"A FAVOR","AL DIA"))'
  ];
}

function applyClientRowFormulas_(sheet, rowNum) {
  sheet.getRange(rowNum, 18, 1, 4).setFormulas([buildClientRowFormulas_(rowNum)]);
  sheet.getRange(rowNum, 18, 1, 3).setNumberFormat('$ #,##0');
}

function ensureSheets_(applyFormulas) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let clientsSh = ss.getSheetByName(SHEET_NAMES.CLIENTES);
  if (!clientsSh) {
    clientsSh = ss.insertSheet(SHEET_NAMES.CLIENTES);
    clientsSh.getRange(2, 1, 1, 17).setValues([[
      'CODIGO', 'CLIENTE', 'LOCALIDAD', 'ZONA', 'NOMBRE', 'DIRECCION',
      'ES CLIENTE?', 'TELEFONO', 'CUIT', 'MEDIO DE PAGO', 'FRECU VISITA (SEMANAS)',
      'TIENE EXI', 'SAPHIRUS', 'SANDRA', 'ALGABO', 'VA ETIQUETADO?', 'REMITO/FACTURA'
    ]]);
  }

  ensureAdminSheet_(ss, SHEET_NAMES.VENTAS, HEADERS.VENTAS);
  ensureAdminSheet_(ss, SHEET_NAMES.VENTAS_DETALLE, HEADERS.VENTAS_DETALLE);
  ensureAdminSheet_(ss, SHEET_NAMES.COBROS, HEADERS.COBROS);
  ensureAdminSheet_(ss, SHEET_NAMES.MOVIMIENTOS_STOCK, HEADERS.MOVIMIENTOS_STOCK);
  ensureAdminSheet_(ss, SHEET_NAMES.STOCK_ACTUAL, HEADERS.STOCK_ACTUAL);

  if (clientsSh.getMaxColumns() < 21) {
    clientsSh.insertColumnsAfter(clientsSh.getMaxColumns(), 21 - clientsSh.getMaxColumns());
  }

  const headerRow = findClientsHeaderRow_(clientsSh);
  clientsSh.getRange(headerRow, 18, 1, 4)
    .setValues([HEADERS.CLIENTES_CTACTE])
    .setFontWeight('bold')
    .setBackground('#1b4332')
    .setFontColor('#ffffff');

  let clientsUpdated = 0;
  if (applyFormulas) {
    const lastClientRow = findLastClientRow_(clientsSh, headerRow);
    const numRows = lastClientRow - headerRow;
    if (numRows > 0) {
      const vals = clientsSh.getRange(1, 1, lastClientRow, 6).getValues();
      let maxCode = getMaxClientCode_(vals, headerRow);
      const colAValues = [];
      const formulasGrid = [];
      let codesChanged = false;
      for (let r = headerRow; r < vals.length; r++) {
        const rowNum = r + 1;
        const curCode = vals[r][0];
        if (isRealClientRow_(vals[r])) {
          if (!String(curCode || '').trim()) {
            maxCode += 1;
            colAValues.push([maxCode]);
            codesChanged = true;
          } else {
            colAValues.push([curCode]);
          }
          formulasGrid.push(buildClientRowFormulas_(rowNum));
          clientsUpdated += 1;
        } else {
          colAValues.push([curCode]);
          formulasGrid.push(['', '', '', '']);
        }
      }
      if (codesChanged) {
        clientsSh.getRange(headerRow + 1, 1, numRows, 1).setValues(colAValues);
      }
      clientsSh.getRange(headerRow + 1, 18, numRows, 4).setFormulas(formulasGrid);
      clientsSh.getRange(headerRow + 1, 18, numRows, 3).setNumberFormat('$ #,##0');
    }
  }
  return {
    ss: ss,
    clientsSh: clientsSh,
    headerRow: headerRow,
    clientsUpdated: clientsUpdated,
    sheets: ss.getSheets().map(function (s) { return s.getName(); })
  };
}

/** Se puede ejecutar manualmente desde Apps Script o desde la web (sin cartel bloqueante) */
function setupSheets() {
  const res = ensureSheets_(true);
  Logger.log('setupSheets OK: ' + res.clientsUpdated + ' clientes actualizados.');
  return { ok: true, clientsUpdated: res.clientsUpdated, sheets: res.sheets };
}

/** Solo para ejecutar desde el menú ⚙️ Distre dentro de Google Sheets */
function setupSheetsFromMenu() {
  const res = setupSheets();
  SpreadsheetApp.getUi().alert(
    'Listo ✅\nSe prepararon las hojas administrativas y ' +
    res.clientsUpdated + ' cuentas corrientes en CLIENTES.'
  );
  return res;
}

function normName_(v) {
  return String(v || '').trim().toUpperCase();
}

function readSheetObjects_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() <= 1) return [];
  const data = sh.getDataRange().getValues();
  const hdr = data[0].map(function (h) { return String(h || '').trim(); });
  const out = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row.some(function (c) { return String(c === null || c === undefined ? '' : c).trim() !== ''; })) continue;
    const obj = {};
    for (let j = 0; j < hdr.length; j++) {
      obj[hdr[j]] = row[j];
    }
    out.push(obj);
  }
  return out;
}

function getClientsPayload_(ss) {
  const clientsSh = ss.getSheetByName(SHEET_NAMES.CLIENTES);
  if (!clientsSh) return { clients: [], summary: { totalClients: 0, debtorsCount: 0, totalDeuda: 0 } };
  const headerRow = findClientsHeaderRow_(clientsSh);
  const lastRow = findLastClientRow_(clientsSh, headerRow);
  const rawClients = lastRow > headerRow
    ? clientsSh.getRange(headerRow + 1, 1, lastRow - headerRow, 17).getValues()
    : [];

  const ventas = readSheetObjects_(ss, SHEET_NAMES.VENTAS);
  const cobros = readSheetObjects_(ss, SHEET_NAMES.COBROS);

  const statsByCode = {};
  const statsByName = {};
  function ensureStat(map, k) {
    if (!map[k]) map[k] = { totalVentas: 0, totalCobros: 0, ventasCount: 0, cobrosCount: 0, lastActivity: '' };
    return map[k];
  }

  ventas.forEach(function (v) {
    const cod = String(v.COD_CLIENTE || '').trim();
    const nom = normName_(v.CLIENTE);
    const total = toNum_(v.TOTAL);
    const fecha = String(v.FECHA || '').trim();
    const bucket = cod ? ensureStat(statsByCode, cod) : (nom ? ensureStat(statsByName, nom) : null);
    if (!bucket) return;
    bucket.totalVentas = round2_(bucket.totalVentas + total);
    bucket.ventasCount += 1;
    if (fecha) bucket.lastActivity = fecha;
  });

  cobros.forEach(function (c) {
    const cod = String(c.COD_CLIENTE || '').trim();
    const nom = normName_(c.CLIENTE);
    const monto = toNum_(c.MONTO);
    const fecha = String(c.FECHA || '').trim();
    const bucket = cod ? ensureStat(statsByCode, cod) : (nom ? ensureStat(statsByName, nom) : null);
    if (!bucket) return;
    bucket.totalCobros = round2_(bucket.totalCobros + monto);
    bucket.cobrosCount += 1;
    if (fecha) bucket.lastActivity = fecha;
  });

  const clients = [];
  let debtorsCount = 0;
  let totalDeuda = 0;

  rawClients.forEach(function (row, idx) {
    if (!isRealClientRow_(row)) return;
    const rowIndex = headerRow + 1 + idx;
    const codigo = String(row[0] || '').trim();
    const cliente = String(row[1] || '').trim();
    const nombre = String(row[4] || '').trim();
    const keyName = normName_(cliente || nombre);
    const st = (codigo && statsByCode[codigo])
      ? statsByCode[codigo]
      : (keyName && statsByName[keyName] ? statsByName[keyName] : { totalVentas: 0, totalCobros: 0, ventasCount: 0, cobrosCount: 0, lastActivity: '' });
    const saldo = round2_(st.totalVentas - st.totalCobros);
    if (saldo > 0) {
      debtorsCount += 1;
      totalDeuda = round2_(totalDeuda + saldo);
    }
    clients.push({
      rowIndex: rowIndex,
      codigo: codigo,
      cliente: cliente || nombre,
      localidad: String(row[2] || '').trim(),
      zona: String(row[3] || '').trim(),
      nombre: nombre,
      direccion: String(row[5] || '').trim(),
      esCliente: String(row[6] || '').trim(),
      telefono: String(row[7] || '').trim(),
      cuit: String(row[8] || '').trim(),
      medioPago: String(row[9] || '').trim(),
      remitoFactura: String(row[16] || '').trim(),
      totalVentas: st.totalVentas,
      totalCobros: st.totalCobros,
      saldo: saldo,
      ventasCount: st.ventasCount,
      cobrosCount: st.cobrosCount,
      lastActivity: st.lastActivity
    });
  });

  return {
    clients: clients,
    summary: {
      totalClients: clients.length,
      debtorsCount: debtorsCount,
      totalDeuda: totalDeuda
    }
  };
}

function ensureClientCodigoOnSheet_(clientsSh, headerRow, targetClient) {
  const rowIndex = Number(targetClient && targetClient.rowIndex);
  if (rowIndex > headerRow) {
    const curCod = String(clientsSh.getRange(rowIndex, 1).getValue() || '').trim();
    if (curCod) return curCod;
    const lastRow = findLastClientRow_(clientsSh, headerRow);
    const vals = lastRow > headerRow ? clientsSh.getRange(1, 1, lastRow, 5).getValues() : [];
    const nextCode = String(getMaxClientCode_(vals, headerRow) + 1);
    clientsSh.getRange(rowIndex, 1).setValue(Number(nextCode));
    applyClientRowFormulas_(clientsSh, rowIndex);
    return nextCode;
  }
  return String((targetClient && targetClient.codigo) || '').trim();
}

function findClientBalance_(ss, codigo, clienteName) {
  const payload = getClientsPayload_(ss);
  const codStr = String(codigo || '').trim();
  const nomUp = normName_(clienteName);
  const found = payload.clients.find(function (c) {
    return (codStr && c.codigo === codStr) || (!codStr && nomUp && normName_(c.cliente) === nomUp);
  });
  return found || { codigo: codStr, cliente: clienteName, totalVentas: 0, totalCobros: 0, saldo: 0 };
}

function handleGetClients_(ss) {
  const payload = getClientsPayload_(ss);
  return { ok: true, clients: payload.clients, summary: payload.summary };
}

function handleGetClientLedger_(ss, body) {
  const codigo = String(body.codigo || '').trim();
  const clienteName = String(body.cliente || '').trim();
  const nomUp = normName_(clienteName);
  const matches = function (rowCod, rowCliente) {
    const rc = String(rowCod || '').trim();
    const rn = normName_(rowCliente);
    if (codigo && rc) return rc === codigo;
    if (nomUp && rn) return rn === nomUp;
    return false;
  };

  const ventas = readSheetObjects_(ss, SHEET_NAMES.VENTAS).filter(function (v) {
    return matches(v.COD_CLIENTE, v.CLIENTE);
  });
  const cobros = readSheetObjects_(ss, SHEET_NAMES.COBROS).filter(function (c) {
    return matches(c.COD_CLIENTE, c.CLIENTE);
  });

  const timeline = [];
  ventas.forEach(function (v) {
    timeline.push({
      tipo: 'VENTA',
      id: String(v.ID_VENTA || ''),
      fecha: String(v.FECHA || ''),
      catalogo: String(v.CATALOGO || ''),
      total: toNum_(v.TOTAL),
      pagado: toNum_(v.PAGADO),
      monto: toNum_(v.TOTAL),
      medioPago: String(v.MEDIO_PAGO || ''),
      estado: String(v.ESTADO || ''),
      nota: String(v.NOTA || '')
    });
  });
  cobros.forEach(function (c) {
    timeline.push({
      tipo: 'COBRO',
      id: String(c.ID_COBRO || ''),
      fecha: String(c.FECHA || ''),
      refVenta: String(c.ID_VENTA || ''),
      monto: toNum_(c.MONTO),
      medioPago: String(c.MEDIO_PAGO || ''),
      nota: String(c.NOTA || '')
    });
  });
  timeline.reverse();

  const client = findClientBalance_(ss, codigo, clienteName);
  return { ok: true, client: client, ventas: ventas.reverse(), cobros: cobros.reverse(), timeline: timeline };
}

function handleCreateClient_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const info = ensureSheets_(false);
    const sh = info.clientsSh;
    const headerRow = info.headerRow;
    const c = body.client || body;
    const cliente = String(c.cliente || '').trim();
    if (!cliente) throw new Error('Ingresá el nombre o razón social del cliente.');

    const lastRow = findLastClientRow_(sh, headerRow);
    const vals = lastRow > headerRow ? sh.getRange(1, 1, lastRow, 5).getValues() : [];
    const nextCode = getMaxClientCode_(vals, headerRow) + 1;
    const newRowNum = lastRow + 1;

    const rowValues = [
      nextCode,
      cliente,
      String(c.localidad || '').trim(),
      String(c.zona || '').trim(),
      String(c.nombre || '').trim(),
      String(c.direccion || '').trim(),
      String(c.esCliente || 'SI').trim(),
      String(c.telefono || '').trim(),
      String(c.cuit || '').trim(),
      String(c.medioPago || '').trim(),
      '', '', '', '', '', '',
      String(c.remitoFactura || '').trim()
    ];
    sh.getRange(newRowNum, 1, 1, 17).setValues([rowValues]);
    applyClientRowFormulas_(sh, newRowNum);

    return {
      ok: true,
      client: {
        rowIndex: newRowNum,
        codigo: String(nextCode),
        cliente: cliente,
        localidad: rowValues[2],
        zona: rowValues[3],
        nombre: rowValues[4],
        direccion: rowValues[5],
        esCliente: rowValues[6],
        telefono: rowValues[7],
        cuit: rowValues[8],
        medioPago: rowValues[9],
        remitoFactura: rowValues[16],
        totalVentas: 0,
        totalCobros: 0,
        saldo: 0,
        ventasCount: 0,
        cobrosCount: 0,
        lastActivity: ''
      }
    };
  } finally {
    lock.releaseLock();
  }
}

function updateStockActualRows_(stockSh, deductions, fechaStr) {
  if (!deductions || !deductions.length) return;
  const lastRow = stockSh.getLastRow();
  const eanRowMap = {};
  if (lastRow > 1) {
    const eanCol = stockSh.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < eanCol.length; i++) {
      const k = String(eanCol[i][0] || '').trim();
      if (k && !eanRowMap[k]) eanRowMap[k] = i + 2;
    }
  }
  const toAppend = [];
  deductions.forEach(function (d) {
    const rowData = [
      String(d.ean || ''),
      String(d.codigoInterno || ''),
      String(d.brand || ''),
      String(d.cat || ''),
      String(d.name || ''),
      d.price !== null && d.price !== undefined ? toNum_(d.price) : '',
      d.newStock !== null && d.newStock !== undefined ? toNum_(d.newStock) : 0,
      fechaStr
    ];
    const existingRow = eanRowMap[String(d.ean || '').trim()];
    if (existingRow) {
      stockSh.getRange(existingRow, 1, 1, 8).setValues([rowData]);
    } else {
      toAppend.push(rowData);
    }
  });
  if (toAppend.length) {
    const startRow = stockSh.getLastRow() + 1;
    stockSh.getRange(startRow, 1, toAppend.length, 8).setValues(toAppend);
  }
}

function handleRegisterSale_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const info = ensureSheets_(false);
    const ss = info.ss;
    const now = new Date();
    const fecha = formatDate_(ss, now);

    const clientInput = body.client || {};
    const clienteName = String(clientInput.cliente || '').trim();
    if (!clienteName) throw new Error('Falta seleccionar el cliente.');
    const codigo = ensureClientCodigoOnSheet_(info.clientsSh, info.headerRow, clientInput);

    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length) throw new Error('La venta no tiene productos.');

    const subtotal = round2_(body.subtotal);
    const descBulto = round2_(body.totalSavings);
    const total = round2_(body.total);
    const pagado = Math.min(total, Math.max(0, round2_(body.pagado)));
    const saldoVenta = round2_(total - pagado);
    const condicion = String(body.condicion || (pagado >= total ? 'CONTADO' : (pagado > 0 ? 'PARCIAL' : 'CUENTA CORRIENTE'))).trim();
    const medioPago = String(body.medioPago || '').trim();
    const nota = String(body.nota || '').trim();
    const catalogo = String(body.catalogName || 'COMPLETO').trim();
    const estado = saldoVenta <= 0 ? 'PAGADO' : (pagado > 0 ? 'PARCIAL' : 'PENDIENTE');

    const saleId = makeId_(ss, 'V', now);

    const ventasSh = ss.getSheetByName(SHEET_NAMES.VENTAS);
    ventasSh.appendRow([
      saleId, fecha, catalogo, /^\d+$/.test(codigo) ? Number(codigo) : codigo,
      clienteName, subtotal, descBulto, total, pagado, saldoVenta,
      condicion, medioPago, estado, nota,
      'PARA_ARMAR', '', '', '', '[]', 0
    ]);

    const deductions = Array.isArray(body.stockDeductions) ? body.stockDeductions : [];
    const deductedMap = {};
    deductions.forEach(function (d) {
      const k = String(d.ean || '').trim();
      if (k) deductedMap[k] = round2_((deductedMap[k] || 0) + toNum_(d.qty));
    });

    const detSh = ss.getSheetByName(SHEET_NAMES.VENTAS_DETALLE);
    const detRows = items.map(function (it) {
      const eanStr = String(it.ean || '').trim();
      const qty = toNum_(it.cantidad);
      return [
        saleId, fecha, catalogo, eanStr,
        String(it.descripcion || it.name || ''),
        qty,
        round2_(it.precioUnitario),
        round2_(it.total),
        qty,
        0,
        deductedMap[eanStr] || 0
      ];
    });
    detSh.getRange(detSh.getLastRow() + 1, 1, detRows.length, HEADERS.VENTAS_DETALLE.length).setValues(detRows);

    let cobroId = '';
    if (pagado > 0) {
      cobroId = makeId_(ss, 'C', now);
      const cobrosSh = ss.getSheetByName(SHEET_NAMES.COBROS);
      cobrosSh.appendRow([
        cobroId, fecha, /^\d+$/.test(codigo) ? Number(codigo) : codigo,
        clienteName, saleId, pagado, medioPago, nota || 'Pago al cerrar venta'
      ]);
    }

    if (deductions.length) {
      const movSh = ss.getSheetByName(SHEET_NAMES.MOVIMIENTOS_STOCK);
      const movRows = deductions.map(function (d) {
        return [
          fecha, 'VENTA', saleId, 'EN STOCK',
          String(d.ean || ''), String(d.name || ''),
          -Math.abs(toNum_(d.qty)), toNum_(d.prevStock), toNum_(d.newStock),
          clienteName
        ];
      });
      movSh.getRange(movSh.getLastRow() + 1, 1, movRows.length, HEADERS.MOVIMIENTOS_STOCK.length).setValues(movRows);
      updateStockActualRows_(ss.getSheetByName(SHEET_NAMES.STOCK_ACTUAL), deductions, fecha);
    }

    const clientBalance = findClientBalance_(ss, codigo, clienteName);
    return {
      ok: true,
      saleId: saleId,
      cobroId: cobroId,
      fecha: fecha,
      codigo: codigo,
      estadoDeposito: 'PARA_ARMAR',
      clientBalance: clientBalance
    };
  } finally {
    lock.releaseLock();
  }
}

function findVentaRowIndex_(ventasSh, saleId) {
  const lastRow = ventasSh.getLastRow();
  if (lastRow <= 1) return -1;
  const colA = ventasSh.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < colA.length; i++) {
    if (String(colA[i][0] || '').trim() === saleId) return i + 2;
  }
  return -1;
}

function handleGetOrders_(ss) {
  const ventasRows = readSheetObjects_(ss, SHEET_NAMES.VENTAS);
  const detalleRows = readSheetObjects_(ss, SHEET_NAMES.VENTAS_DETALLE);
  const clientsData = getClientsPayload_(ss).clients || [];

  const cliByCode = {};
  const cliByName = {};
  clientsData.forEach(function (c) {
    if (c.codigo) cliByCode[c.codigo] = c;
    const n = normName_(c.cliente);
    if (n && !cliByName[n]) cliByName[n] = c;
  });

  const detBySale = {};
  detalleRows.forEach(function (d) {
    const id = String(d.ID_VENTA || '').trim();
    if (!id) return;
    if (!detBySale[id]) detBySale[id] = [];
    detBySale[id].push(d);
  });

  const orders = [];
  ventasRows.forEach(function (v) {
    const saleId = String(v.ID_VENTA || '').trim();
    if (!saleId) return;
    const codigo = String(v.COD_CLIENTE || '').trim();
    const cliente = String(v.CLIENTE || '').trim();
    const cliMeta = (codigo && cliByCode[codigo]) || cliByName[normName_(cliente)] || {};
    const estadoDep = String(v.ESTADO_DEPOSITO || '').trim().toUpperCase() || 'PARA_ARMAR';

    const rawItems = detBySale[saleId] || [];
    const items = rawItems.map(function (d) {
      const cantidad = toNum_(d.CANTIDAD);
      const hasPedida = d.CANT_PEDIDA !== undefined && String(d.CANT_PEDIDA).trim() !== '';
      const hasArmada = d.CANT_ARMADA !== undefined && String(d.CANT_ARMADA).trim() !== '';
      const hasDesc = d.CANT_DESCONTADA !== undefined && String(d.CANT_DESCONTADA).trim() !== '';
      const cantPedida = hasPedida ? toNum_(d.CANT_PEDIDA) : cantidad;
      const cantArmada = hasArmada ? toNum_(d.CANT_ARMADA)
        : ((estadoDep === 'LISTO' || estadoDep === 'ENTREGADO') ? cantidad : 0);
      const cantDescontada = hasDesc ? toNum_(d.CANT_DESCONTADA) : cantidad;
      return {
        ean: String(d.EAN || '').trim(),
        descripcion: String(d.DESCRIPCION || '').trim(),
        catalogo: String(d.CATALOGO || '').trim(),
        cantidad: cantidad,
        cantPedida: cantPedida,
        cantArmada: cantArmada,
        cantDescontada: cantDescontada,
        precioUnitario: round2_(d.PRECIO_UNIT),
        total: round2_(d.TOTAL)
      };
    });

    let devoluciones = [];
    try {
      const parsed = JSON.parse(String(v.DEVOLUCIONES_JSON || '[]'));
      if (Array.isArray(parsed)) devoluciones = parsed;
    } catch (e) {}

    orders.push({
      saleId: saleId,
      fecha: String(v.FECHA || '').trim(),
      catalogo: String(v.CATALOGO || '').trim(),
      codigo: codigo,
      cliente: cliente,
      localidad: cliMeta.localidad || '',
      direccion: cliMeta.direccion || '',
      telefono: cliMeta.telefono || '',
      zona: cliMeta.zona || '',
      clientSaldo: typeof cliMeta.saldo === 'number' ? cliMeta.saldo : 0,
      subtotal: round2_(v.SUBTOTAL),
      descBulto: round2_(v.DESC_BULTO),
      totalDevoluciones: round2_(v.TOTAL_DEVOLUCIONES),
      total: round2_(v.TOTAL),
      pagado: round2_(v.PAGADO),
      saldoVenta: round2_(v.SALDO_VENTA),
      condicion: String(v.CONDICION || '').trim(),
      medioPago: String(v.MEDIO_PAGO || '').trim(),
      estado: String(v.ESTADO || '').trim(),
      nota: String(v.NOTA || '').trim(),
      estadoDeposito: estadoDep,
      fechaArmado: String(v.FECHA_ARMADO || '').trim(),
      fechaEntrega: String(v.FECHA_ENTREGA || '').trim(),
      fechaCobroAcordada: String(v.FECHA_COBRO_ACORDADA || '').trim(),
      devoluciones: devoluciones,
      items: items
    });
  });

  orders.reverse();
  return { ok: true, orders: orders };
}

function handleSaveOrderPacking_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const info = ensureSheets_(false);
    const ss = info.ss;
    const saleId = String(body.saleId || '').trim();
    if (!saleId) throw new Error('Falta ID de venta.');

    const ventasSh = ss.getSheetByName(SHEET_NAMES.VENTAS);
    const rowIdx = findVentaRowIndex_(ventasSh, saleId);
    if (rowIdx < 2) throw new Error('No se encontró la venta ' + saleId + '.');

    const row = ventasSh.getRange(rowIdx, 1, 1, HEADERS.VENTAS.length).getValues()[0];
    const saleFecha = String(row[1] || '').trim();
    const catalogo = String(row[2] || 'EN STOCK').trim();
    const codigo = String(row[3] || '').trim();
    const clienteName = String(row[4] || '').trim();
    const pagado = round2_(row[8]);
    const existingFechaArmado = String(row[15] || '').trim();

    const subtotal = round2_(body.subtotal);
    const descBulto = round2_(body.descBulto);
    const totalDevoluciones = round2_(body.totalDevoluciones);
    const total = round2_(body.total);
    const saldoVenta = round2_(total - pagado);
    const estado = saldoVenta <= 0 ? 'PAGADO' : (pagado > 0 ? 'PARCIAL' : 'PENDIENTE');
    const nextStatus = String(body.nextStatus || 'EN_ESPERA').trim().toUpperCase();
    const now = new Date();
    const fecha = formatDate_(ss, now);
    const fechaArmado = nextStatus === 'LISTO' ? fecha : existingFechaArmado;
    const devs = Array.isArray(body.devoluciones) ? body.devoluciones : [];

    row[5] = subtotal;
    row[6] = descBulto;
    row[7] = total;
    row[9] = saldoVenta;
    row[12] = estado;
    row[13] = body.nota !== undefined ? String(body.nota || '').trim() : String(row[13] || '').trim();
    row[14] = nextStatus;
    row[15] = fechaArmado;
    row[18] = JSON.stringify(devs);
    row[19] = totalDevoluciones;
    ventasSh.getRange(rowIdx, 1, 1, HEADERS.VENTAS.length).setValues([row]);

    const items = Array.isArray(body.items) ? body.items : [];
    const detSh = ss.getSheetByName(SHEET_NAMES.VENTAS_DETALLE);
    const detLast = detSh.getLastRow();
    const detCols = HEADERS.VENTAS_DETALLE.length;
    const keptRows = [];
    if (detLast > 1) {
      const existingDet = detSh.getRange(2, 1, detLast - 1, Math.max(detCols, detSh.getLastColumn())).getValues();
      existingDet.forEach(function (r) {
        if (String(r[0] || '').trim() !== saleId && r.some(function (c) { return String(c === null || c === undefined ? '' : c).trim() !== ''; })) {
          const padded = [];
          for (let c = 0; c < detCols; c++) padded.push(r[c] !== undefined ? r[c] : '');
          keptRows.push(padded);
        }
      });
    }
    const newDetRows = items.map(function (it) {
      const cantPed = toNum_(it.cantPedida);
      const cantArm = toNum_(it.cantArmada);
      const cantDesc = it.cantDescontada !== undefined ? toNum_(it.cantDescontada) : cantArm;
      return [
        saleId,
        saleFecha || fecha,
        String(it.catalogo || catalogo),
        String(it.ean || '').trim(),
        String(it.descripcion || it.name || '').trim(),
        cantArm,
        round2_(it.precioUnitario),
        round2_(it.total),
        cantPed,
        cantArm,
        cantDesc
      ];
    });
    const combinedDet = keptRows.concat(newDetRows);
    if (detLast > 1) detSh.getRange(2, 1, detLast - 1, detCols).clearContent();
    if (combinedDet.length) detSh.getRange(2, 1, combinedDet.length, detCols).setValues(combinedDet);

    const stockAdj = Array.isArray(body.stockAdjustments) ? body.stockAdjustments : [];
    if (stockAdj.length) {
      const movSh = ss.getSheetByName(SHEET_NAMES.MOVIMIENTOS_STOCK);
      const movRows = stockAdj.map(function (d) {
        const delta = toNum_(d.delta); // +N => salió más stock; -N => volvió al stock
        const tipo = delta > 0 ? 'AJUSTE_ARMADO_MAS' : 'DEVOLUCION_ARMADO';
        return [
          fecha, tipo, saleId, 'EN STOCK',
          String(d.ean || ''), String(d.name || ''),
          -delta, toNum_(d.prevStock), toNum_(d.newStock),
          clienteName
        ];
      });
      movSh.getRange(movSh.getLastRow() + 1, 1, movRows.length, HEADERS.MOVIMIENTOS_STOCK.length).setValues(movRows);
      updateStockActualRows_(ss.getSheetByName(SHEET_NAMES.STOCK_ACTUAL), stockAdj, fecha);
    }

    const clientBalance = findClientBalance_(ss, codigo, clienteName);
    return {
      ok: true,
      saleId: saleId,
      estadoDeposito: nextStatus,
      fechaArmado: fechaArmado,
      total: total,
      saldoVenta: saldoVenta,
      estado: estado,
      clientBalance: clientBalance
    };
  } finally {
    lock.releaseLock();
  }
}

function handleConfirmDelivery_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const info = ensureSheets_(false);
    const ss = info.ss;
    const saleId = String(body.saleId || '').trim();
    if (!saleId) throw new Error('Falta ID de venta.');

    const ventasSh = ss.getSheetByName(SHEET_NAMES.VENTAS);
    const rowIdx = findVentaRowIndex_(ventasSh, saleId);
    if (rowIdx < 2) throw new Error('No se encontró la venta ' + saleId + '.');

    const now = new Date();
    const fecha = formatDate_(ss, now);
    const row = ventasSh.getRange(rowIdx, 1, 1, HEADERS.VENTAS.length).getValues()[0];
    const codigo = String(row[3] || '').trim();
    const clienteName = String(row[4] || '').trim();
    const total = round2_(row[7]);
    let pagado = round2_(row[8]);
    const monto = round2_(body.monto);
    const medioPago = String(body.medioPago || row[11] || '').trim();
    const fechaCobroAcordada = String(body.fechaCobroAcordada || '').trim();
    const notaEntrega = String(body.nota || '').trim();

    let cobroId = '';
    if (monto > 0) {
      cobroId = makeId_(ss, 'C', now);
      const cobrosSh = ss.getSheetByName(SHEET_NAMES.COBROS);
      cobrosSh.appendRow([
        cobroId, fecha, /^\d+$/.test(codigo) ? Number(codigo) : codigo,
        clienteName, saleId, monto, medioPago,
        notaEntrega || 'Cobro al confirmar entrega en Depósito'
      ]);
      pagado = round2_(pagado + monto);
    }

    const saldoVenta = round2_(total - pagado);
    const estado = saldoVenta <= 0 ? 'PAGADO' : (pagado > 0 ? 'PARCIAL' : 'PENDIENTE');
    const prevNota = String(row[13] || '').trim();
    const finalNota = notaEntrega ? (prevNota ? prevNota + ' | Entrega: ' + notaEntrega : 'Entrega: ' + notaEntrega) : prevNota;

    row[8] = pagado;
    row[9] = saldoVenta;
    if (medioPago) row[11] = medioPago;
    row[12] = estado;
    row[13] = finalNota;
    row[14] = 'ENTREGADO';
    row[16] = fecha;
    row[17] = fechaCobroAcordada;
    ventasSh.getRange(rowIdx, 1, 1, HEADERS.VENTAS.length).setValues([row]);

    const clientBalance = findClientBalance_(ss, codigo, clienteName);
    return {
      ok: true,
      saleId: saleId,
      cobroId: cobroId,
      estadoDeposito: 'ENTREGADO',
      fechaEntrega: fecha,
      pagado: pagado,
      saldoVenta: saldoVenta,
      estado: estado,
      fechaCobroAcordada: fechaCobroAcordada,
      nota: finalNota,
      clientBalance: clientBalance
    };
  } finally {
    lock.releaseLock();
  }
}

function handleReopenOrder_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const info = ensureSheets_(false);
    const ss = info.ss;
    const saleId = String(body.saleId || '').trim();
    if (!saleId) throw new Error('Falta ID de venta.');
    const ventasSh = ss.getSheetByName(SHEET_NAMES.VENTAS);
    const rowIdx = findVentaRowIndex_(ventasSh, saleId);
    if (rowIdx < 2) throw new Error('No se encontró la venta ' + saleId + '.');
    ventasSh.getRange(rowIdx, 15).setValue('EN_ESPERA');
    return { ok: true, saleId: saleId, estadoDeposito: 'EN_ESPERA' };
  } finally {
    lock.releaseLock();
  }
}

function handleCancelOrder_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const info = ensureSheets_(false);
    const ss = info.ss;
    const saleId = String(body.saleId || '').trim();
    if (!saleId) throw new Error('Falta ID de venta.');

    const ventasSh = ss.getSheetByName(SHEET_NAMES.VENTAS);
    const rowIdx = findVentaRowIndex_(ventasSh, saleId);
    if (rowIdx < 2) throw new Error('No se encontró la venta ' + saleId + '.');

    const row = ventasSh.getRange(rowIdx, 1, 1, HEADERS.VENTAS.length).getValues()[0];
    const currentDep = String(row[14] || '').trim().toUpperCase();
    if (currentDep === 'CANCELADO') {
      throw new Error('Este pedido ya está cancelado.');
    }

    const codigo = String(row[3] || '').trim();
    const clienteName = String(row[4] || '').trim();
    const origTotal = round2_(row[7]);
    const motivo = String(body.motivo || '').trim();
    const fecha = formatDate_(ss, new Date());
    const cancelTag = 'CANCELADO ' + fecha
      + (origTotal > 0 ? ' (total orig. $ ' + origTotal + ')' : '')
      + (motivo ? ': ' + motivo : '');
    const prevNota = String(row[13] || '').trim();
    const finalNota = prevNota ? (prevNota + ' | ' + cancelTag) : cancelTag;

    row[5] = 0;
    row[6] = 0;
    row[7] = 0;
    row[9] = 0;
    row[12] = 'CANCELADO';
    row[13] = finalNota;
    row[14] = 'CANCELADO';
    row[17] = '';
    row[19] = 0;
    ventasSh.getRange(rowIdx, 1, 1, HEADERS.VENTAS.length).setValues([row]);

    const detSh = ss.getSheetByName(SHEET_NAMES.VENTAS_DETALLE);
    const detLast = detSh.getLastRow();
    const detCols = HEADERS.VENTAS_DETALLE.length;
    const stockRestored = body.stockRestored !== false;
    if (detLast > 1) {
      const detVals = detSh.getRange(2, 1, detLast - 1, Math.max(detCols, detSh.getLastColumn())).getValues();
      let detDirty = false;
      const updatedDet = detVals.map(function (r) {
        const padded = [];
        for (let c = 0; c < detCols; c++) padded.push(r[c] !== undefined ? r[c] : '');
        if (String(padded[0] || '').trim() === saleId) {
          padded[5] = 0; // CANTIDAD
          padded[7] = 0; // TOTAL
          padded[9] = 0; // CANT_ARMADA
          if (stockRestored) padded[10] = 0; // CANT_DESCONTADA
          detDirty = true;
        }
        return padded;
      });
      if (detDirty) {
        detSh.getRange(2, 1, updatedDet.length, detCols).setValues(updatedDet);
      }
    }

    const stockAdj = Array.isArray(body.stockAdjustments) ? body.stockAdjustments : [];
    if (stockAdj.length) {
      const movSh = ss.getSheetByName(SHEET_NAMES.MOVIMIENTOS_STOCK);
      const movRows = stockAdj.map(function (d) {
        return [
          fecha, 'CANCELACION_PEDIDO', saleId, 'EN STOCK',
          String(d.ean || ''), String(d.name || ''),
          Math.abs(toNum_(d.delta)), toNum_(d.prevStock), toNum_(d.newStock),
          clienteName
        ];
      });
      movSh.getRange(movSh.getLastRow() + 1, 1, movRows.length, HEADERS.MOVIMIENTOS_STOCK.length).setValues(movRows);
      updateStockActualRows_(ss.getSheetByName(SHEET_NAMES.STOCK_ACTUAL), stockAdj, fecha);
    }

    const clientBalance = findClientBalance_(ss, codigo, clienteName);
    return {
      ok: true,
      saleId: saleId,
      estadoDeposito: 'CANCELADO',
      estado: 'CANCELADO',
      total: 0,
      saldoVenta: 0,
      nota: finalNota,
      clientBalance: clientBalance
    };
  } finally {
    lock.releaseLock();
  }
}

function handleRegisterPayment_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const info = ensureSheets_(false);
    const ss = info.ss;
    const now = new Date();
    const fecha = formatDate_(ss, now);

    const clientInput = body.client || {};
    const clienteName = String(clientInput.cliente || '').trim();
    if (!clienteName) throw new Error('Falta especificar el cliente.');
    const codigo = ensureClientCodigoOnSheet_(info.clientsSh, info.headerRow, clientInput);
    const monto = round2_(body.monto);
    if (!(monto > 0)) throw new Error('El monto del cobro debe ser mayor a 0.');

    const cobroId = makeId_(ss, 'C', now);
    const cobrosSh = ss.getSheetByName(SHEET_NAMES.COBROS);
    cobrosSh.appendRow([
      cobroId, fecha,
      /^\d+$/.test(codigo) ? Number(codigo) : codigo,
      clienteName,
      String(body.idVenta || '').trim(),
      monto,
      String(body.medioPago || '').trim(),
      String(body.nota || '').trim()
    ]);

    const clientBalance = findClientBalance_(ss, codigo, clienteName);
    return { ok: true, cobroId: cobroId, fecha: fecha, codigo: codigo, clientBalance: clientBalance };
  } finally {
    lock.releaseLock();
  }
}

function handleSyncStockSnapshot_(body) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const info = ensureSheets_(false);
    const ss = info.ss;
    const stockSh = ss.getSheetByName(SHEET_NAMES.STOCK_ACTUAL);
    const fecha = formatDate_(ss, new Date());
    const items = Array.isArray(body.items) ? body.items : [];

    const lastRow = stockSh.getLastRow();
    if (lastRow > 1) {
      stockSh.getRange(2, 1, lastRow - 1, 8).clearContent();
    }
    if (items.length) {
      const rows = items.map(function (p) {
        return [
          String(p.ean || ''),
          String(p.codigoInterno || ''),
          String(p.brand || p.tab || ''),
          String(p.cat || ''),
          String(p.name || ''),
          p.price !== null && p.price !== undefined ? toNum_(p.price) : '',
          p.stock !== null && p.stock !== undefined ? toNum_(p.stock) : 0,
          fecha
        ];
      });
      stockSh.getRange(2, 1, rows.length, 8).setValues(rows);
    }
    return { ok: true, count: items.length, fecha: fecha };
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    checkAuth_(p.apiKey || '');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (p.action === 'getClients') return jsonOut_(handleGetClients_(ss));
    if (p.action === 'getClientLedger') return jsonOut_(handleGetClientLedger_(ss, p));
    if (p.action === 'getOrders') return jsonOut_(handleGetOrders_(ss));
    return jsonOut_({
      ok: true,
      spreadsheetName: ss.getName(),
      sheets: ss.getSheets().map(function (s) { return s.getName(); })
    });
  } catch (err) {
    return jsonOut_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const body = JSON.parse(raw);
    checkAuth_(body.apiKey);
    const action = String(body.action || 'ping');
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'ping') {
      return jsonOut_({
        ok: true,
        spreadsheetName: ss.getName(),
        sheets: ss.getSheets().map(function (s) { return s.getName(); })
      });
    }
    if (action === 'setupSheets') return jsonOut_(setupSheets());
    if (action === 'getClients') return jsonOut_(handleGetClients_(ss));
    if (action === 'getClientLedger') return jsonOut_(handleGetClientLedger_(ss, body));
    if (action === 'createClient') return jsonOut_(handleCreateClient_(body));
    if (action === 'registerSale') return jsonOut_(handleRegisterSale_(body));
    if (action === 'registerPayment') return jsonOut_(handleRegisterPayment_(body));
    if (action === 'syncStockSnapshot') return jsonOut_(handleSyncStockSnapshot_(body));
    if (action === 'getOrders') return jsonOut_(handleGetOrders_(ss));
    if (action === 'saveOrderPacking') return jsonOut_(handleSaveOrderPacking_(body));
    if (action === 'confirmDelivery') return jsonOut_(handleConfirmDelivery_(body));
    if (action === 'reopenOrderToPacking') return jsonOut_(handleReopenOrder_(body));
    if (action === 'cancelOrder') return jsonOut_(handleCancelOrder_(body));

    throw new Error('Acción desconocida: ' + action);
  } catch (err) {
    return jsonOut_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}
