/**
 * Stock App - Server-side functions
 * Marie Gabison Paris
 *
 * Endpoints:
 *   GET  ?app=stock                              → page HTML (legacy)
 *   GET  ?action=getStock                         → JSON produits
 *   GET  ?action=delete&row=N                     → supprime ligne N
 *   GET  ?action=getCollections                   → JSON collections
 *   GET  ?action=deleteCollection&row=N           → supprime collection
 *   POST ?action=addProduct                       → ajoute produit (+ images base64)
 *   POST ?action=addCollection                    → crée collection
 *   POST ?action=updateCollection                 → modifie collection
 */

// ─── Paramètres ───────────────────────────────────────────────
var STOCK_SPREADSHEET_ID = '1p3dvpr_wH0iU3pGnjLQXrpjgp_sm3WSaurKoLWBc_Yw';
var STOCK_SHEET_NAME = 'Réponses au formulaire 1';
var COLLECTIONS_SHEET_NAME = 'Collections';
var DRIVE_FOLDER_NAME = 'Marie Gabison Products';

// ═══════════════════════════════════════════════════════════════
// doGet — routes GET
// ═══════════════════════════════════════════════════════════════
function serveStockApp(e) {
  var action = e && e.parameter && e.parameter.action;

  // Legacy: page HTML
  if (!action || action === 'page') {
    return serveStockPage_(e);
  }

  if (action === 'getStock') {
    return jsonOut_(getStock());
  }

  if (action === 'delete' && e.parameter.row) {
    return jsonOut_(deleteProduct(parseInt(e.parameter.row, 10)));
  }

  if (action === 'getCollections') {
    return jsonOut_(getCollections());
  }

  if (action === 'deleteCollection' && e.parameter.row) {
    return jsonOut_(deleteCollection(parseInt(e.parameter.row, 10)));
  }

  return jsonOut_({ error: 'Action GET inconnue: ' + action });
}

// ═══════════════════════════════════════════════════════════════
// doPost — routes POST (addProduct, addCollection, updateCollection)
// ═══════════════════════════════════════════════════════════════
function serveStockAppPost(e) {
  var action = e && e.parameter && e.parameter.action;

  if (action === 'addProduct') {
    return jsonOut_(addProduct(e));
  }

  if (action === 'addCollection') {
    return jsonOut_(addCollection(e));
  }

  if (action === 'updateCollection') {
    return jsonOut_(updateCollection(e));
  }

  if (action === 'updateProduct') {
    return jsonOut_(updateProduct(e));
  }

  return jsonOut_({ error: 'Action POST inconnue: ' + action });
}

// ═══════════════════════════════════════════════════════════════
// PRODUITS
// ═══════════════════════════════════════════════════════════════

// ─── Lit tous les produits ────────────────────────────────────
function getStock() {
  try {
    var sh = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID).getSheetByName(STOCK_SHEET_NAME);
    if (!sh) return { error: 'Sheet not found: ' + STOCK_SHEET_NAME };

    var values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return { items: [] };

    var header = values[0];
    var fields = parseHeaderStock_(header);
    var colIdx = findColumnIndex_(header, 'collection');

    var items = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      var title = cellStock_(row, fields.title);
      var price = cellStock_(row, fields.price);
      var type = cellStock_(row, fields.category);
      var desc = cellStock_(row, fields.description);
      var rawImages = cellStock_(row, fields.image);

      if (!isFilledStock_(title) && !isFilledStock_(price) && !isFilledStock_(desc)) continue;

      var imageUrls = [];
      try { imageUrls = resolveImages_(rawImages); } catch (e) { imageUrls = []; }

      items.push({
        rowIndex: i + 1,
        title: String(title || ''),
        type: String(type || ''),
        price: price !== '' ? String(price) : '',
        description: String(desc || ''),
        images: imageUrls,
        imageUrl: imageUrls.length ? imageUrls[0] : '',
        category: normalizeCategoryStock_(type),
        collection: colIdx >= 0 ? String(row[colIdx] || '') : ''
      });
    }

    return { items: items };
  } catch (e) {
    return { error: String(e && e.message || e) };
  }
}

// ─── Ajoute un produit (POST avec images base64) ──────────────
function addProduct(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    // body: { name, type, price, description, collection, images: [{ name, mimeType, data }] }

    if (!body.name || !body.name.trim()) {
      return { error: 'Le nom est obligatoire' };
    }
    if (!body.images || body.images.length === 0) {
      return { error: 'Au moins une image est obligatoire' };
    }

    // 1. Upload images vers Drive
    var folder = getOrCreateDriveFolder_();
    var imageUrls = [];
    for (var i = 0; i < body.images.length; i++) {
      var img = body.images[i];
      var bytes = Utilities.base64Decode(img.data);
      var blob = Utilities.newBlob(bytes, img.mimeType || 'image/jpeg', img.name || ('image_' + i + '.jpg'));
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrls.push('https://lh3.googleusercontent.com/d/' + file.getId());
    }

    // 2. Ajouter la ligne au sheet
    var ss = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID);
    var sh = ss.getSheetByName(STOCK_SHEET_NAME);
    if (!sh) return { error: 'Sheet not found' };

    var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var fields = parseHeaderStock_(header);

    // S'assurer qu'une colonne Collection existe
    var colIdx = findColumnIndex_(header, 'collection');
    if (colIdx < 0) {
      // Ajouter la colonne Collection à la fin
      var lastCol = sh.getLastColumn();
      sh.getRange(1, lastCol + 1).setValue('Collection');
      colIdx = lastCol; // 0-based
      header.push('Collection');
    }

    // Construire la ligne
    var row = new Array(header.length).fill('');
    if (fields.title !== undefined) row[fields.title] = body.name;
    if (fields.category !== undefined) row[fields.category] = body.type || '';
    if (fields.price !== undefined) row[fields.price] = body.price || '';
    if (fields.description !== undefined) row[fields.description] = body.description || '';
    if (fields.image !== undefined) row[fields.image] = imageUrls.join(', ');
    row[colIdx] = body.collection || '';

    // Ajouter un horodateur si la colonne existe
    var tsIdx = findColumnIndex_(header, 'horodateur');
    if (tsIdx >= 0) row[tsIdx] = new Date();

    sh.appendRow(row);

    return { success: true, imageUrls: imageUrls, rowIndex: sh.getLastRow() };
  } catch (err) {
    return { error: String(err && err.message || err) };
  }
}

// ─── Supprime une ligne produit ───────────────────────────────
function deleteProduct(rowIndex) {
  try {
    var sh = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID).getSheetByName(STOCK_SHEET_NAME);
    if (!sh) return { error: 'Sheet not found' };
    var lastRow = sh.getLastRow();
    if (rowIndex < 2 || rowIndex > lastRow) {
      return { error: 'Index de ligne invalide: ' + rowIndex };
    }
    sh.deleteRow(rowIndex);
    return { success: true, deletedRow: rowIndex };
  } catch (e) {
    return { error: String(e && e.message || e) };
  }
}

// ─── Modifie un produit (POST) ────────────────────────────────
function updateProduct(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    // body: { rowIndex, name?, type?, price?, description?, collection? }
    if (!body.rowIndex) return { error: 'rowIndex manquant' };

    var sh = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID).getSheetByName(STOCK_SHEET_NAME);
    if (!sh) return { error: 'Sheet not found' };
    var lastRow = sh.getLastRow();
    if (body.rowIndex < 2 || body.rowIndex > lastRow) {
      return { error: 'Index de ligne invalide' };
    }

    var header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    var fields = parseHeaderStock_(header);
    var colIdx = findColumnIndex_(header, 'collection');

    var rowIdx = body.rowIndex;
    var updated = [];

    if (body.name !== undefined && fields.title !== undefined) {
      sh.getRange(rowIdx, fields.title + 1).setValue(body.name);
      updated.push('name');
    }
    if (body.type !== undefined && fields.category !== undefined) {
      sh.getRange(rowIdx, fields.category + 1).setValue(body.type);
      updated.push('type');
    }
    if (body.price !== undefined && fields.price !== undefined) {
      sh.getRange(rowIdx, fields.price + 1).setValue(body.price);
      updated.push('price');
    }
    if (body.description !== undefined && fields.description !== undefined) {
      sh.getRange(rowIdx, fields.description + 1).setValue(body.description);
      updated.push('description');
    }
    if (body.collection !== undefined && colIdx >= 0) {
      sh.getRange(rowIdx, colIdx + 1).setValue(body.collection);
      updated.push('collection');
    }

    return { success: true, updated: updated };
  } catch (err) {
    return { error: String(err && err.message || err) };
  }
}

// ═══════════════════════════════════════════════════════════════
// COLLECTIONS
// ═══════════════════════════════════════════════════════════════

// ─── Lit toutes les collections ───────────────────────────────
function getCollections() {
  try {
    var ss = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID);
    var sh = ss.getSheetByName(COLLECTIONS_SHEET_NAME);
    if (!sh) {
      // Créer le sheet s'il n'existe pas
      sh = ss.insertSheet(COLLECTIONS_SHEET_NAME);
      sh.appendRow(['Nom', 'Description', 'Date création']);
      return { items: [] };
    }
    var values = sh.getDataRange().getValues();
    if (values.length < 2) return { items: [] };

    var items = [];
    for (var i = 1; i < values.length; i++) {
      if (!values[i][0]) continue;
      items.push({
        rowIndex: i + 1,
        name: String(values[i][0]),
        description: String(values[i][1] || ''),
        createdAt: values[i][2] ? new Date(values[i][2]).toISOString() : ''
      });
    }
    return { items: items };
  } catch (e) {
    return { error: String(e && e.message || e) };
  }
}

// ─── Crée une collection ──────────────────────────────────────
function addCollection(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.name || !body.name.trim()) {
      return { error: 'Le nom de la collection est obligatoire' };
    }

    var ss = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID);
    var sh = ss.getSheetByName(COLLECTIONS_SHEET_NAME);
    if (!sh) {
      sh = ss.insertSheet(COLLECTIONS_SHEET_NAME);
      sh.appendRow(['Nom', 'Description', 'Date création']);
    }

    // Vérifier doublon
    var existing = sh.getDataRange().getValues();
    for (var i = 1; i < existing.length; i++) {
      if (String(existing[i][0]).trim().toLowerCase() === body.name.trim().toLowerCase()) {
        return { error: 'Cette collection existe déjà' };
      }
    }

    sh.appendRow([body.name.trim(), body.description || '', new Date()]);
    return { success: true, rowIndex: sh.getLastRow() };
  } catch (err) {
    return { error: String(err && err.message || err) };
  }
}

// ─── Modifie une collection ───────────────────────────────────
function updateCollection(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (!body.rowIndex) return { error: 'rowIndex manquant' };

    var sh = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID).getSheetByName(COLLECTIONS_SHEET_NAME);
    if (!sh) return { error: 'Sheet Collections not found' };

    var lastRow = sh.getLastRow();
    if (body.rowIndex < 2 || body.rowIndex > lastRow) {
      return { error: 'Index invalide' };
    }

    if (body.name) sh.getRange(body.rowIndex, 1).setValue(body.name.trim());
    if (body.description !== undefined) sh.getRange(body.rowIndex, 2).setValue(body.description);

    return { success: true };
  } catch (err) {
    return { error: String(err && err.message || err) };
  }
}

// ─── Supprime une collection ──────────────────────────────────
function deleteCollection(rowIndex) {
  try {
    var sh = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID).getSheetByName(COLLECTIONS_SHEET_NAME);
    if (!sh) return { error: 'Sheet Collections not found' };
    var lastRow = sh.getLastRow();
    if (rowIndex < 2 || rowIndex > lastRow) {
      return { error: 'Index invalide' };
    }
    sh.deleteRow(rowIndex);
    return { success: true, deletedRow: rowIndex };
  } catch (e) {
    return { error: String(e && e.message || e) };
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function serveStockPage_(e) {
  // Legacy: servir la page HTML (non utilisé par /stock Vercel)
  if (e && e.parameter && e.parameter.action === 'delete' && e.parameter.row) {
    deleteProduct(parseInt(e.parameter.row, 10));
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head>' +
      '<meta http-equiv="refresh" content="0; url=' + getStockAppUrl_() + '">' +
      '</head><body>Redirection…</body></html>'
    ).setTitle('Stock').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  var htmlTemplate = HtmlService.createHtmlOutputFromFile('StockApp').getContent();
  var stockData = getStock();
  var htmlContent = htmlTemplate.replace('<?= stockDataJson ?>', JSON.stringify(stockData));
  return ContentService.createTextOutput(htmlContent).setMimeType(ContentService.MimeType.HTML);
}

function getStockAppUrl_() {
  var url = ScriptApp.getService().getUrl();
  if (url.indexOf('app=stock') === -1) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + 'app=stock';
  }
  return url;
}

function getOrCreateDriveFolder_() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function findColumnIndex_(headers, fieldKey) {
  var MAP = {
    'collection': ['collection', 'collections']
  };
  var synonyms = MAP[fieldKey] || [fieldKey];
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim().toLowerCase();
    var hl = stripAccentsStock_(h).replace(/[\s_]+/g, '');
    for (var s = 0; s < synonyms.length; s++) {
      if (hl === stripAccentsStock_(synonyms[s]).replace(/[\s_]+/g, '')) return c;
    }
  }
  return -1;
}

function parseHeaderStock_(headers) {
  var FIELD_MAP = {
    'nom': 'title', 'name': 'title', 'titre': 'title', 'title': 'title',
    'type': 'category', 'category': 'category', 'categorie': 'category',
    'prix': 'price', 'price': 'price',
    'images': 'image', 'image': 'image', 'photo': 'image', 'photos': 'image', 'img': 'image', 'imageurl': 'image',
    'description': 'description', 'desc': 'description',
    'horodateur': 'horodateur', 'timestamp': 'horodateur'
  };
  var fields = {};
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim();
    if (!h) continue;
    var hl = stripAccentsStock_(h.toLowerCase()).replace(/[\s_]+/g, '');
    var field = FIELD_MAP[hl];
    if (field && fields[field] === undefined) fields[field] = c;
  }
  return fields;
}

function stripAccentsStock_(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeCategoryStock_(raw) {
  var s = String(raw || '').trim().toLowerCase();
  s = s.replace(/\s+/g, ' ');
  if (s === 'collier' || s === 'colliers') return 'Collier';
  if (s === 'bracelet' || s === 'bracelets') return 'Bracelet';
  if (s === 'boucles' || s === "boucle d'oreille" || s === "boucles d'oreille") return "Boucles";
  if (s === 'bague' || s === 'bagues') return 'Bague';
  if (s === 'parure' || s === 'parures') return 'Parure';
  if (s === 'autre' || s === 'autres' || s === 'divers') return 'Autre';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Autre';
}

function cellStock_(row, idx) {
  return typeof idx === 'number' ? row[idx] : '';
}

function isFilledStock_(x) {
  if (x === null || x === undefined) return false;
  if (typeof x === 'number') return true;
  return String(x).trim() !== '';
}
