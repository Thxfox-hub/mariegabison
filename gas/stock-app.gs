/**
 * Stock App - Server-side functions
 * Mini app de gestion du stock pour Marie Gabison Paris
 *
 * Sert l'HTML avec les données injectées directement (pas de fetch côté client,
 * pas de google.script.run — fonctionne dans Google Sites).
 *
 * Routes:
 *   ?app=stock            → page HTML avec données intégrées
 *   ?app=stock&action=delete&row=N  → supprime puis redirige vers ?app=stock
 */

// ─── Paramètres ───────────────────────────────────────────────
var STOCK_SPREADSHEET_ID = '1p3dvpr_wH0iU3pGnjLQXrpjgp_sm3WSaurKoLWBc_Yw';
var STOCK_SHEET_NAME = 'Réponses au formulaire 1';

// ─── Sert la page HTML (avec données injectées) ───────────────
function serveStockApp(e) {
  // Si action=delete, supprimer puis rediriger
  if (e && e.parameter && e.parameter.action === 'delete' && e.parameter.row) {
    var rowIndex = parseInt(e.parameter.row, 10);
    deleteProduct(rowIndex);
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head>' +
      '<meta http-equiv="refresh" content="0; url=' + getStockAppUrl_() + '">' +
      '</head><body>Redirection…</body></html>'
    )
    .setTitle('Stock — Marie Gabison Paris')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Page normale: lire le HTML brut depuis le fichier StockApp,
  // injecter les données manuellement (remplacement de string),
  // servir via ContentService (pas d'iframe sandbox, pas de CSP stricte)
  var htmlTemplate = getRawHtml_('StockApp');
  var stockData = getStock();
  var stockDataJson = JSON.stringify(stockData);
  // Remplacer le scriptlet manuellement
  var htmlContent = htmlTemplate.replace('<?= stockDataJson ?>', stockDataJson);

  return ContentService.createTextOutput(htmlContent)
    .setMimeType(ContentService.MimeType.HTML);
}

// ─── Lit le contenu brut d'un fichier HTML sans wrapper GAS ───
function getRawHtml_(fileName) {
  // createHtmlOutputFromFile retourne un HtmlOutput dont getContent()
  // donne le HTML tel quel (sans l'évaluation des scriptlets)
  return HtmlService.createHtmlOutputFromFile(fileName).getContent();
}

// ─── URL de l'app stock (pour redirection après suppression) ──
function getStockAppUrl_() {
  var url = ScriptApp.getService().getUrl();
  // Ajouter ?app=stock si pas déjà présent
  if (url.indexOf('app=stock') === -1) {
    url += (url.indexOf('?') === -1 ? '?' : '&') + 'app=stock';
  }
  return url;
}

// ─── Lit tous les produits ────────────────────────────────────
function getStock() {
  try {
    var sh = SpreadsheetApp.openById(STOCK_SPREADSHEET_ID).getSheetByName(STOCK_SHEET_NAME);
    if (!sh) return { error: 'Sheet not found: ' + STOCK_SHEET_NAME };

    var values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return { items: [] };

    var header = values[0];
    var fields = parseHeaderStock_(header);

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
      try {
        imageUrls = resolveImages_(rawImages);
      } catch (e) {
        imageUrls = [];
      }

      items.push({
        rowIndex: i + 1,
        title: String(title || ''),
        type: String(type || ''),
        price: price !== '' ? String(price) : '',
        description: String(desc || ''),
        images: imageUrls,
        imageUrl: imageUrls.length ? imageUrls[0] : '',
        category: normalizeCategoryStock_(type)
      });
    }

    return { items: items };
  } catch (e) {
    return { error: String(e && e.message || e) };
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

// ─── Helpers ──────────────────────────────────────────────────

function parseHeaderStock_(headers) {
  var FIELD_MAP = {
    'nom': 'title', 'name': 'title', 'titre': 'title', 'title': 'title',
    'type': 'category', 'category': 'category', 'categorie': 'category',
    'prix': 'price', 'price': 'price',
    'images': 'image', 'image': 'image', 'photo': 'image', 'photos': 'image', 'img': 'image', 'imageurl': 'image',
    'description': 'description', 'desc': 'description'
  };
  var fields = {};
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c] || '').trim();
    if (!h) continue;
    var hl = stripAccentsStock_(h.toLowerCase()).replace(/[\s_]+/g, '');
    var field = FIELD_MAP[hl];
    if (field && fields[field] === undefined) {
      fields[field] = c;
    }
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
