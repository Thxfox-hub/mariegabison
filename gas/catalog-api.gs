/**
 * API Catalogue Marie Gabison
 * - Format plat (réponses formulaire) : Horodateur | Nom | Type | Prix | Images | Description
 *   Colonnes reconnues (insensible casse/accents) :
 *     Nom/Name/Titre → title
 *     Type/Category/Categorie → category (normalisée via normalizeCategory_)
 *     Prix/Price → price
 *     Images/Image/Photo/Photos → image (plusieurs URLs séparées par virgules)
 *     Description/Desc → description
 * - Catégories normalisées: Collier, Bracelet, Boucles d'oreille, Bague, Parure, Homme, Femme, Autres
 * - Images: URLs directes ou liens Google Drive (open?id=XXX, /file/d/XXX, ID brut)
 *   → converties en URL publique lh3.googleusercontent.com/d/XXX (avec setSharing automatique)
 * - Retourne: { success: true, data: [ {id,title,price,category,description?,imageUrl?,images?} ] }
 *   imageUrl = 1ère image (rétrocompat), images = array de toutes les images
 */

const SPREADSHEET_ID = '1p3dvpr_wH0iU3pGnjLQXrpjgp_sm3WSaurKoLWBc_Yw';
const SHEET_NAME = 'Réponses au formulaire 1';

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
    Logger.log('Header parsed fields: %s', JSON.stringify(meta.fields));
    Logger.log('Row count (excluding header): %s', meta.rowCount);
    Logger.log('Items built: %s', items.length);

    items.slice(0, 5).forEach((it, idx) => {
      Logger.log('#%s: %s', idx + 1, JSON.stringify(it));
    });

    if (!items.length) {
      Logger.log('No items found. Check header names (expected: Nom, Type, Prix, Images, Description)');
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
    return { items: [], meta: { sheetName: SHEET_NAME, rowCount: 0, fields: {}, categories: [] } };
  }

  const header = values[0];
  const rows = values.slice(1);

  Logger.log('Header columns: %s', JSON.stringify(header));

  const fields = parseHeader_(header);
  Logger.log('Parsed fields: %s', JSON.stringify(fields));

  const items = [];
  const categoriesSet = {};

  rows.forEach((row, i) => {
    const title = cell_(row, fields.title);
    const price = parsePrice_(cell_(row, fields.price));
    const description = cell_(row, fields.description);
    const rawType = cell_(row, fields.category);
    const category = fields.category !== undefined ? normalizeCategory_(rawType) : 'Autres';
    const images = resolveImages_(cell_(row, fields.image));

    if (!isFilled_(title) && !isFilled_(price) && !isFilled_(description)) return;

    categoriesSet[category] = true;

    items.push({
      id: makeId_(category, i + 2, title),
      title: String(title || ''),
      price: price !== null ? price : undefined,
      category: category,
      description: String(description || ''),
      imageUrl: images.length ? images[0] : undefined,
      images: images.length ? images : undefined
    });
  });

  const categories = Object.keys(categoriesSet);

  return {
    items,
    meta: {
      sheetName: SHEET_NAME,
      rowCount: rows.length,
      fields,
      categories
    }
  };
}

/* =============== Helpers =============== */

/**
 * Parse l'en-tête plat et retourne les indices des colonnes par champ.
 * Reconnait (insensible casse/accents) :
 *   Nom/Name/Titre/Title → title
 *   Type/Category/Categorie → category
 *   Prix/Price → price
 *   Images/Image/Photo/Photos/Img → image
 *   Description/Desc → description
 */
function parseHeader_(headers) {
  const FIELD_MAP = {
    'nom': 'title', 'name': 'title', 'titre': 'title', 'title': 'title',
    'type': 'category', 'category': 'category', 'categorie': 'category',
    'prix': 'price', 'price': 'price',
    'images': 'image', 'image': 'image', 'photo': 'image', 'photos': 'image', 'img': 'image', 'imageurl': 'image',
    'description': 'description', 'desc': 'description'
  };

  const fields = {};

  for (var c = 0; c < headers.length; c++) {
    const h = String(headers[c] || '').trim();
    if (!h) continue;

    const hl = stripAccents_(h.toLowerCase()).replace(/[\s_]+/g, '');
    const field = FIELD_MAP[hl];
    if (field && fields[field] === undefined) {
      fields[field] = c;
    }
  }

  return fields;
}

function stripAccents_(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
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

// Cache des IDs d'images déjà partagés pour éviter les appels setSharing répétés
const SHARED_IMAGES_CACHE = {};

/**
 * Convertit une cellule "Images" (potentiellement plusieurs URLs séparées par virgules)
 * en un tableau d'URLs utilisables.
 * Accepte par élément:
 *  - URL directe (http/https) → retournée telle quelle
 *  - Lien drive.google.com/open?id=XXX → extrait l'ID et convertit
 *  - Lien drive.google.com/file/d/XXX → extrait l'ID et convertit
 *  - ID Google Drive brut (alphanumérique 10+ chars) → converti
 *  - Chemin AppSheet → cherche dans Google Drive
 *  - Nom de fichier → cherche dans le dossier du spreadsheet
 */
function resolveImages_(v) {
  if (!isFilled_(v)) return [];
  const s = String(v).trim();
  if (!s) return [];

  // Séparer par virgules (les URLs Drive du formulaire sont séparées par ", ")
  const parts = s.split(/[,;]\s*/).map(function(p) { return p.trim(); }).filter(function(p) { return p; });
  const urls = [];

  for (var i = 0; i < parts.length; i++) {
    var url = resolveSingleImage_(parts[i]);
    if (url) urls.push(url);
  }

  return urls;
}

function resolveSingleImage_(s) {
  if (!s) return '';

  // Ignorer les valeurs purement numériques (ex: prix qui fuit dans la colonne image)
  if (/^\d+(?:[.,]\d+)?$/.test(s)) return '';

  // URL directe (non Drive) → retournée telle quelle
  if (/^https?:\/\//i.test(s) && s.indexOf('drive.google.com') === -1) return s;

  // Lien drive.google.com/open?id=XXX → extraire l'ID
  var openMatch = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch && s.indexOf('drive.google.com') !== -1) {
    return ensureDriveUrl_(openMatch[1]);
  }

  // Lien drive.google.com/file/d/XXX → extraire l'ID
  var driveMatch = s.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return ensureDriveUrl_(driveMatch[1]);
  }

  // ID Google Drive brut (alphanumérique, typiquement 20-40 chars)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) {
    return ensureDriveUrl_(s);
  }

  // Chemin AppSheet (ex: "Feuille 1_Images/Ntm.collier_image.191210.jpg")
  if (s.indexOf('/') !== -1 || s.indexOf('\\') !== -1) {
    var driveUrl = findDriveImageByPath_(s);
    if (driveUrl) return driveUrl;
  }

  // Dernier recours: chercher par nom de fichier dans le dossier du spreadsheet
  if (/[a-zA-Z]/.test(s) && /\./.test(s)) {
    var fallbackUrl = findDriveImageByName_(s);
    if (fallbackUrl) return fallbackUrl;
  }

  // URL Drive non reconnue mais commençant par http → la retourner telle quelle
  if (/^https?:\/\//i.test(s)) return s;

  return '';
}

/**
 * Construit l'URL publique lh3.googleusercontent.com/d/XXX
 * et s'assure que le fichier Drive est partagé "Anyone with link"
 */
function ensureDriveUrl_(fileId) {
  if (!fileId) return '';
  try {
    if (!SHARED_IMAGES_CACHE[fileId]) {
      var file = DriveApp.getFileById(fileId);
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
      SHARED_IMAGES_CACHE[fileId] = true;
    }
  } catch (e) {
    Logger.log('ensureDriveUrl_ error for id "%s": %s', fileId, e.message || e);
  }
  return 'https://lh3.googleusercontent.com/d/' + fileId;
}

/**
 * Cherche une image dans Google Drive à partir d'un chemin AppSheet
 * ex: "Feuille 1_Images/Ntm.collier_image.191210.jpg"
 * Le dossier parent est celui qui contient le spreadsheet
 */
function findDriveImageByPath_(path) {
  try {
    const parts = path.replace(/\\/g, '/').split('/');
    const fileName = parts.pop();
    const folderName = parts.join('/');

    const ssFile = DriveApp.getFileById(SPREADSHEET_ID);
    const parentFolder = ssFile.getParents().next();

    const folderIter = parentFolder.getFolders();
    let targetFolder = null;
    while (folderIter.hasNext()) {
      const f = folderIter.next();
      if (f.getName() === folderName || f.getName() === folderName.replace(/_/g, ' ')) {
        targetFolder = f;
        break;
      }
    }

    if (!targetFolder) {
      targetFolder = parentFolder;
    }

    const fileIter = targetFolder.getFilesByName(fileName);
    if (fileIter.hasNext()) {
      const file = fileIter.next();
      const fileId = file.getId();
      if (!SHARED_IMAGES_CACHE[fileId]) {
        try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(e) {}
        SHARED_IMAGES_CACHE[fileId] = true;
      }
      return 'https://lh3.googleusercontent.com/d/' + fileId;
    }

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
 * et ses sous-dossiers (récursif, max 2 niveaux)
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
