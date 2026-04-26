# Marie Gabison Bijoux (Next.js + Vercel)

Site vitrine en React/Next.js, prêt pour Vercel. Le catalogue est chargé depuis un Google Apps Script publié en Web App, lisant une Google Sheet (images hébergées via URL dans la sheet).

## 1) Structure attendue des données
Votre Google Apps Script doit retourner un JSON sous la forme d'un tableau d'objets :

```json
[
  {
    "id": "123",
    "title": "Collier perles",
    "price": 25,
    "imageUrl": "https://.../image.jpg",
    "category": "Collier",
    "description": "Description optionnelle"
  }
]
```

Catégories supportées dans l'UI : `Collier`, `Bracelet`, `Boucles d'oreille`, `Autres`.

## 2) Exemple Google Apps Script (Code.gs)

1. Créez une feuille `Produits` avec colonnes : A: `id`, B: `title`, C: `price`, D: `imageUrl`, E: `category`, F: `description`.
2. Dans Apps Script, collez :

```js
function doGet() {
  const ss = SpreadsheetApp.openById('VOTRE_SHEET_ID');
  const sh = ss.getSheetByName('Produits');
  const values = sh.getDataRange().getValues();
  const [header, ...rows] = values;
  const items = rows
    .filter(r => r.filter(String).length) // ignore lignes vides
    .map(r => ({
      id: String(r[0] || ''),
      title: String(r[1] || ''),
      price: Number(r[2] || 0),
      imageUrl: String(r[3] || ''),
      category: String(r[4] || ''),
      description: String(r[5] || ''),
    }));
  return ContentService
    .createTextOutput(JSON.stringify(items))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. Déployez : Déployer > Déployer en tant qu'application Web.
   - Exécuter en tant que : vous-même
   - Qui a accès : « Tout le monde » (ou « Toute personne disposant du lien », selon vos besoins)
   - Copiez l'URL fournie (Web App URL).

## 3) Configuration locale

- Créez un fichier `.env.local` à la racine :

```
NEXT_PUBLIC_GAS_URL=https://script.google.com/macros/s/.../exec
```

- Installez et lancez :

```
npm install
npm run dev
```

## 4) Déploiement sur Vercel

- Importez ce repo dans Vercel.
- Variables d'environnement (Project Settings > Environment Variables) :
  - `NEXT_PUBLIC_GAS_URL` → l'URL de votre Web App.
- Build & Output : configuration par défaut pour Next.js.

## 5) Personnaliser Instagram

Modifiez l'URL dans `app/page.jsx` et `components/Header.jsx` (prop `instagramUrl`).

## 6) Notes

- Les images doivent être accessibles publiquement par URL. `next.config.js` autorise les domaines distants.
- Le fetch est côté client (pas de cache, `cache: 'no-store'`) pour toujours refléter la sheet.
