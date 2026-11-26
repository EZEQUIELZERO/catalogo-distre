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
    'CONDICION', 'MEDIO_PAGO', 'ESTADO', 'NOTA'
  ],
  VENTAS_DETALLE: [
    'ID_VENTA', 'FECHA', 'CATALOGO', 'EAN', 'DESCRIPCION',
    'CANTIDAD', 'PRECIO_UNIT', 'TOTAL'
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
    .addItem('Preparar hojas y cuentas corrientes', 'setupSheets')
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

function applyClientRowFormulas_(sheet, rowNum) {
  const r = rowNum;
  sheet.getRange(r, 18, 1, 4).setFormulas([[
    '=IF(A' + r + '="",0,SUMIF(VENTAS!$D:$D,A' + r + ',VENTAS!$H:$H))',
    '=IF(A' + r + '="",0,SUMIF(COBROS!$C:$C,A' + r + ',COBROS!$F:$F))',
    '=R' + r + '-S' + r,
    '=IF(T' + r + '>0,"CON DEUDA",IF(T' + r + '<0,"A FAVOR","AL DIA"))'
  ]]);
  sheet.getRange(r, 18, 1, 3).setNumberFormat('$ #,##0');
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

  const headerRow = findClientsHeaderRow_(clientsSh);
  clientsSh.getRange(headerRow, 18, 1, 4)
    .setValues([HEADERS.CLIENTES_CTACTE])
    .setFontWeight('bold')
    .setBackground('#1b4332')
    .setFontColor('#ffffff');

  let clientsUpdated = 0;
  if (applyFormulas) {
    const lastClientRow = findLastClientRow_(clientsSh, headerRow);
    if (lastClientRow > headerRow) {
      const vals = clientsSh.getRange(1, 1, lastClientRow, 6).getValues();
      let maxCode = getMaxClientCode_(vals, headerRow);
      for (let r = headerRow; r < vals.length; r++) {
        if (!isRealClientRow_(vals[r])) continue;
        const rowNum = r + 1;
        if (!String(vals[r][0] || '').trim()) {
          maxCode += 1;
          clientsSh.getRange(rowNum, 1).setValue(maxCode);
        }
        applyClientRowFormulas_(clientsSh, rowNum);
        clientsUpdated += 1;
      }
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

/** Se puede ejecutar manualmente desde Apps Script o desde el menú ⚙️ Distre */
function setupSheets() {
  const res = ensureSheets_(true);
  try {
    SpreadsheetApp.getUi().alert(
      'Listo ✅\nSe prepararon las hojas administrativas y ' +
      res.clientsUpdated + ' cuentas corrientes en CLIENTES.'
    );
  } catch (e) {}
  return { ok: true, clientsUpdated: res.clientsUpdated, sheets: res.sheets };
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
      condicion, medioPago, estado, nota
    ]);

    const detSh = ss.getSheetByName(SHEET_NAMES.VENTAS_DETALLE);
    const detRows = items.map(function (it) {
      return [
        saleId, fecha, catalogo, String(it.ean || ''),
        String(it.descripcion || it.name || ''),
        toNum_(it.cantidad),
        round2_(it.precioUnitario),
        round2_(it.total)
      ];
    });
    detSh.getRange(detSh.getLastRow() + 1, 1, detRows.length, 8).setValues(detRows);

    let cobroId = '';
    if (pagado > 0) {
      cobroId = makeId_(ss, 'C', now);
      const cobrosSh = ss.getSheetByName(SHEET_NAMES.COBROS);
      cobrosSh.appendRow([
        cobroId, fecha, /^\d+$/.test(codigo) ? Number(codigo) : codigo,
        clienteName, saleId, pagado, medioPago, nota || 'Pago al cerrar venta'
      ]);
    }

    const deductions = Array.isArray(body.stockDeductions) ? body.stockDeductions : [];
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
      movSh.getRange(movSh.getLastRow() + 1, 1, movRows.length, 10).setValues(movRows);
      updateStockActualRows_(ss.getSheetByName(SHEET_NAMES.STOCK_ACTUAL), deductions, fecha);
    }

    const clientBalance = findClientBalance_(ss, codigo, clienteName);
    return { ok: true, saleId: saleId, cobroId: cobroId, fecha: fecha, codigo: codigo, clientBalance: clientBalance };
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

    throw new Error('Acción desconocida: ' + action);
  } catch (err) {
    return jsonOut_({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}
