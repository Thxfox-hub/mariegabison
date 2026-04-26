/**
 * API Catalogue Marie Gabison
 * - Colonnes acceptées par groupe (underscore ou espaces) : nom|prix|description|image
 *   ex: collier_nom, collier_prix, collier_description, collier_image (description & image optionnelles)
 * - Catégories normalisées: Collier, Bracelet, Boucles d'oreille, Bague, Parure, Homme, Femme, Autres
 * - Image: colonne <categorie>_image ou <categorie>_photo ou <categorie>_imageUrl
 *   → URL directe ou ID Google Drive (converti automatiquement en URL publique)
 * - Retourne: { success: true, data: [ {id,title,price,category,description?,imageUrl?} ] }
 */

const SPREADSHEET_ID = '1EZ5sRppxoOWMKiI-wO-fFwiSSqwdMz_EFR2-dZW56Cs';
const SHEET_NAME = 'Feuille 1';

function doGet(e) {
  if (e && e.parameter && e.parameter.test === '1') {
    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  }

  const wantsDebug = e && e.parameter && e.parameter.debug === '1';
  const wantsPretty = e && e.parameter && e.parameter.pretty === '1';

  try {
    const { items, meta } = buildItems_();

    Logger.log('=== doGet Summary ===');
    Logger.log('Sheet: %s / Rows: %s / Categories: %s', meta.sheetName, meta.rowCount, meta.categories.join(', '));
    Logger.log('Items built: %s', items.length);
    if (items.length) {
      Logger.log('First item: %s', JSON.stringify(items[0]));
    }

    const payload = wantsDebug
      ? { success: true, data: items, meta }
      : { success: true, data: items };

    if (wantsPretty) {
      return ContentService
        .createTextOutput(JSON.stringify(payload, null, 2))
        .setMimeType(ContentService.MimeType.TEXT);
    }

    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('Error in doGet: %s\nStack: %s', err && err.message || err, err && err.stack);
    const errorPayload = { success: false, error: String(err && err.message || err) };

    if (wantsPretty) {
      return ContentService
        .createTextOutput(JSON.stringify(errorPayload, null, 2))
        .setMimeType(ContentService.MimeType.TEXT);
    }

    return ContentService
      .createTextOutput(JSON.stringify(errorPayload))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doTest() {
  try {
    const { items, meta } = buildItems_();

    Logger.log('=== doTest Detailed Logs ===');
    Logger.log('Spreadsheet ID: %s', SPREADSHEET_ID);
    Logger.log('Sheet: %s', meta.sheetName);
    Logger.log('Header parsed categories: %s', meta.categories.join(', '));
    Logger.log('Row count (excluding header): %s', meta.rowCount);
    Logger.log('Items built: %s', items.length);

    items.slice(0, 5).forEach((it, idx) => {
      Logger.log('#%s: %s', idx + 1, JSON.stringify(it));
    });

    if (!items.length) {
      Logger.log('No items found. Check header names (ex: collier_nom, collier_prix, collier_image, homme_nom, femme_prix, ...)');
      Logger.log('Make sure at least one of title/price/description is present on a row.');
    }

  } catch (e) {
    Logger.log('Error in doTest: %s\nStack: %s', e && e.message || e, e && e.stack);
  }
}

/* =============== Core builder =============== */
function buildItems_() {
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  if (!sh) throw new Error('Sheet not found: ' + SHEET_NAME);

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) {
    return { items: [], meta: { sheetName: SHEET_NAME, rowCount: 0, categories: [] } };
  }

  const header = values[0];
  const rows = values.slice(1);

  Logger.log('Header columns: %s', JSON.stringify(header));

  const parsed = parseHeader_(header);
  const catMap = parsed.map;
  const categories = parsed.categories;

  Logger.log('Parsed categories: %s', categories.join(', '));
  Logger.log('Category map: %s', JSON.stringify(catMap));

  const items = [];
  rows.forEach((row, i) => {
    categories.forEach((cat) => {
      const f = catMap[cat] || {};
      const title = cell_(row, f.title);
      const price = parsePrice_(cell_(row, f.price));
      const description = cell_(row, f.description);
      const imageUrl = resolveImage_(cell_(row, f.image));

      if (!isFilled_(title) && !isFilled_(price) && !isFilled_(description)) return;

      items.push({
        id: makeId_(cat, i + 2, title),
        title: String(title || ''),
        price: price !== null ? price : undefined,
        category: cat,
        description: String(description || ''),
        imageUrl: imageUrl || undefined
      });
    });
  });

  return {
    items,
    meta: {
      sheetName: SHEET_NAME,
      rowCount: rows.length,
      categories
    }
  };
}

/* =============== Helpers =============== */

function parseHeader_(headers) {
  const FIELD_MAP = {
    'nom': 'title', 'name': 'title', 'titre': 'title',
    'prix': 'price', 'price': 'price',
    'description': 'description', 'desc': 'description',
    'image': 'image', 'photo': 'image', 'imageurl': 'image', 'img': 'image'
  };

  const map = {};
  const cats = [];

  for (var c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim();
    if (!h) continue;

    const hl = h.toLowerCase().replace(/[']/g, "'");
    const parts = hl.split(/[\s_]+/);
    if (parts.length < 2) continue;

    const suffix = parts.pop();
    const catRaw = parts.join(' ');
    const field = FIELD_MAP[suffix];
    if (!field) continue;

    const cat = normalizeCategory_(catRaw);
    if (!map[cat]) { map[cat] = {}; cats.push(cat); }
    map[cat][field] = c;
  }

  return { map, categories: cats };
}

function normalizeCategory_(raw) {
  let s = String(raw || '').trim().toLowerCase();
  s = s.replace(/\s+/g, ' ').replace(/[']/g, "'");
  if (s === 'collier' || s === 'colliers') return 'Collier';
  if (s === 'bracelet' || s === 'bracelets') return 'Bracelet';
  if (s === 'boucles' || s === "boucle d'oreille" || s === "boucles d'oreille" || s === 'oreille') return "Boucles d'oreille";
  if (s === 'bague' || s === 'bagues') return 'Bague';
  if (s === 'parure' || s === 'parures') return 'Parure';
  if (s === 'homme' || s === 'hommes' || s === 'men') return 'Homme';
  if (s === 'femme' || s === 'femmes' || s === 'women') return 'Femme';
  if (s === 'autre' || s === 'autres' || s === 'divers') return 'Autres';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Autres';
}

/**
 * Convertit une valeur image en URL utilisable.
 * Accepte:
 *  - URL directe (http/https) → retournée telle quelle
 *  - ID Google Drive (ex: 1AbC...xyz) → converti en lien de visualisation
 *  - Lien drive.google.com/file/d/XXXX/ → extrait l'ID et convertit
 *  - Chemin AppSheet (ex: "Feuille 1_Images/Ntm.collier_image.191210.jpg")
 *    → cherche le fichier dans le dossier parent du spreadsheet et retourne l'URL publique
 */
// Cache des IDs d'images déjà partagés pour éviter les appels setSharing répétés
const SHARED_IMAGES_CACHE = {};

function resolveImage_(v) {
  if (!isFilled_(v)) return '';
  const s = String(v).trim();
  if (!s) return '';

  // Ignorer les valeurs purement numériques (ex: prix qui fuit dans la colonne image)
  if (/^\d+(?:[.,]\d+)?$/.test(s)) return '';

  // URL directe
  if (/^https?:\/\//i.test(s)) return s;

  // Lien Google Drive complet → extraire l'ID
  const driveMatch = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return 'https://lh3.googleusercontent.com/d/' + driveMatch[1];
  }

  // ID Google Drive brut (alphanumérique, typiquement 20-40 chars)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) {
    return 'https://lh3.googleusercontent.com/d/' + s;
  }

  // Chemin AppSheet (ex: "Feuille 1_Images/Ntm.collier_image.191210.jpg")
  // → chercher le fichier dans Google Drive et retourner l'URL publique
  if (s.indexOf('/') !== -1 || s.indexOf('\\') !== -1) {
    const driveUrl = findDriveImageByPath_(s);
    if (driveUrl) return driveUrl;
  }

  // Dernier recours: chercher par nom de fichier dans le dossier du spreadsheet
  // Uniquement si ça ressemble à un nom de fichier (contient un point ou des lettres)
  if (/[a-zA-Z]/.test(s) && /\./.test(s)) {
    const fallbackUrl = findDriveImageByName_(s);
    if (fallbackUrl) return fallbackUrl;
  }

  // Sinon retourner tel quel
  return s;
}

/**
 * Cherche une image dans Google Drive à partir d'un chemin AppSheet
 * ex: "Feuille 1_Images/Ntm.collier_image.191210.jpg"
 * Le dossier parent est celui qui contient le spreadsheet
 */
function findDriveImageByPath_(path) {
  try {
    // Extraire le nom du dossier et du fichier
    const parts = path.replace(/\\/g, '/').split('/');
    const fileName = parts.pop();
    const folderName = parts.join('/');

    // Trouver le dossier du spreadsheet (utiliser SPREADSHEET_ID car getActiveSpreadsheet()
    // retourne null en contexte web app déployée)
    const ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    const parentFolder = ssFile.getParents().next();

    // Chercher le sous-dossier AppSheet
    const folderIter = parentFolder.getFolders();
    let targetFolder = null;
    while (folderIter.hasNext()) {
      const f = folderIter.next();
      if (f.getName() === folderName || f.getName() === folderName.replace(/_/g, ' ')) {
        targetFolder = f;
        break;
      }
    }

    // Si le dossier n'est pas trouvé, chercher directement dans le parent
    if (!targetFolder) {
      targetFolder = parentFolder;
    }

    // Chercher le fichier par nom
    const fileIter = targetFolder.getFilesByName(fileName);
    if (fileIter.hasNext()) {
      const file = fileIter.next();
      // Rendre le fichier publiquement accessible (lecture) si pas déjà fait
      const fileId = file.getId();
      if (!SHARED_IMAGES_CACHE[fileId]) {
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
        SHARED_IMAGES_CACHE[fileId] = true;
      }
      return 'https://lh3.googleusercontent.com/d/' + fileId;
    }

    // Chercher aussi dans les sous-dossiers
    const subFolders = targetFolder.getFolders();
    while (subFolders.hasNext()) {
      const sub = subFolders.next();
      const subFileIter = sub.getFilesByName(fileName);
      if (subFileIter.hasNext()) {
        const file = subFileIter.next();
        const fileId2 = file.getId();
        if (!SHARED_IMAGES_CACHE[fileId2]) {
          try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
          SHARED_IMAGES_CACHE[fileId2] = true;
        }
        return 'https://lh3.googleusercontent.com/d/' + fileId2;
      }
    }
  } catch (e) {
    Logger.log('findDriveImageByPath_ error for "%s": %s', path, e.message || e);
  }
  return null;
}

/**
 * Cherche une image par nom de fichier dans le dossier du spreadsheet
 * et ses sous-dossiers (récurseif, max 2 niveaux)
 */
function findDriveImageByName_(fileName) {
  try {
    const ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    const parentFolder = ssFile.getParents().next();
    const result = searchFileInFolder_(parentFolder, fileName, 2);
    if (result) {
      const fileId = result.getId();
      if (!SHARED_IMAGES_CACHE[fileId]) {
        try { result.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
        SHARED_IMAGES_CACHE[fileId] = true;
      }
      return 'https://lh3.googleusercontent.com/d/' + fileId;
    }
  } catch (e) {
    Logger.log('findDriveImageByName_ error for "%s": %s', fileName, e.message || e);
  }
  return null;
}

function searchFileInFolder_(folder, fileName, maxDepth) {
  if (maxDepth <= 0) return null;
  try {
    const fileIter = folder.getFilesByName(fileName);
    if (fileIter.hasNext()) return fileIter.next();
    const subFolders = folder.getFolders();
    while (subFolders.hasNext()) {
      const result = searchFileInFolder_(subFolders.next(), fileName, maxDepth - 1);
      if (result) return result;
    }
  } catch (e) {}
  return null;
}

function parsePrice_(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  const s = String(v).trim();
  if (!s) return null;
  const normalized = s.replace(/[€\s]/g, '').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function cell_(row, idx) { return typeof idx === 'number' ? row[idx] : ''; }

function makeId_(category, rowNumber, title) {
  return slug_(category) + '-' + rowNumber + (title ? '-' + slug_(title) : '');
}

function slug_(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isFilled_(x) {
  if (x === null || x === undefined) return false;
  if (typeof x === 'number') return true;
  return String(x).trim() !== '';
}
