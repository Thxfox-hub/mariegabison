"use client";

import { useState, useEffect, useCallback } from 'react';

// URL du Google Form pour ajouter des produits
const FORM_ID = '1FAIpQLSf1wZQ-5rFkKDgd5IfqTy_4cYBDCAJ1ZrZyhnDHdPUTrPhRRg';
const FORM_URL = 'https://docs.google.com/forms/d/e/' + FORM_ID + '/viewform';
const FORM_SUBMIT_URL = 'https://docs.google.com/forms/d/e/' + FORM_ID + '/formResponse';

// Entry IDs du formulaire
const ENTRY = {
  name:        'entry.1599191546',
  type:        'entry.1541764032',
  typeSentinel:'entry.1541764032_sentinel',
  price:       'entry.1818115217',
  description: 'entry.1685287951',
};

export default function StockPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState('');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', type: 'Collier', price: '', desc: '' });
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Auth ───
  const handleLogin = (e) => {
    e.preventDefault();
    // Le token est le mot de passe saisi
    const t = password.trim();
    if (!t) return;
    setToken(t);
    setAuthed(true);
    setPassword('');
    setAuthError('');
  };

  // ─── Fetch products ───
  const loadStock = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stock', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setAuthed(false);
          setToken('');
          setAuthError('Mot de passe incorrect');
        }
        throw new Error(data.error || 'Erreur');
      }
      setProducts(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authed) loadStock();
  }, [authed, loadStock]);

  // ─── Delete product ───
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/stock?row=' + deleteTarget.rowIndex, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setDeleteTarget(null);
      loadStock();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Add product (submit to Google Form via hidden iframe) ───
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAdding(true);
    setAddSuccess(false);

    // Créer une iframe cachée
    const iframeName = 'submit_ifr_' + Date.now();
    const iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = FORM_SUBMIT_URL;
    form.target = iframeName;
    form.style.display = 'none';

    const addField = (name, value) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    };

    addField(ENTRY.name, addForm.name);
    addField(ENTRY.type, addForm.type);
    addField(ENTRY.typeSentinel, '');
    addField(ENTRY.price, addForm.price);
    addField(ENTRY.description, addForm.desc);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      try { document.body.removeChild(form); } catch {}
      try { document.body.removeChild(iframe); } catch {}
      setAdding(false);
      setAddSuccess(true);
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess(false);
        setAddForm({ name: '', type: 'Collier', price: '', desc: '' });
        loadStock();
      }, 1500);
    }, 3000);
  };

  // ─── Filtrage ───
  const categories = [...new Set(products.map(p => p.category || 'Autre'))].sort();
  const filtered = products.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (search) {
      const hay = (p.title + ' ' + p.description + ' ' + p.category).toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const fmtPrice = (p) => {
    const n = parseFloat(String(p).replace(/[€\s]/g, '').replace(',', '.'));
    return isNaN(n) ? p : n.toFixed(2).replace('.', ',');
  };

  // ═══════════════════════════════════════════════════════════════
  // LOGIN SCREEN
  // ═══════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 32, maxWidth: 380, width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, textAlign: 'center', marginBottom: 4, color: '#2a2520' }}>
            Marie Gabison Paris
          </h1>
          <p style={{ textAlign: 'center', color: '#8a8278', fontSize: 13, marginBottom: 24 }}>Gestion du stock</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="input"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 14, marginBottom: 12, fontFamily: 'inherit' }}
              autoFocus
            />
            {authError && <p style={{ color: '#b33a3a', fontSize: 13, marginBottom: 8 }}>{authError}</p>}
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#8b7355', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STOCK DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: 'Jost, sans-serif', color: '#2a2520' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e0d8', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 22, margin: 0, color: '#2a2520' }}>
            Marie Gabison Paris
          </h1>
          <p style={{ fontSize: 12, color: '#8a8278', margin: '2px 0 0' }}>Gestion du stock</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setShowAddModal(true)} style={btnPrimary}>+ Ajouter un produit</button>
          <button onClick={loadStock} style={btnSm} title="Rafraîchir">↻</button>
          <button onClick={() => { setAuthed(false); setToken(''); }} style={btnSm}>Déconnexion</button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e0d8', padding: '12px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#faf9f7' }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveCategory('all')} style={activeCategory === 'all' ? catBtnActive : catBtn}>
            Tout ({products.length})
          </button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={activeCategory === cat ? catBtnActive : catBtn}>
              {cat} ({products.filter(p => p.category === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '8px 24px', display: 'flex', gap: 20, fontSize: 12, color: '#8a8278' }}>
        <span><strong style={{ color: '#2a2520' }}>{products.length}</strong> produit{products.length > 1 ? 's' : ''}</span>
        <span><strong style={{ color: '#2a2520' }}>{products.filter(p => p.price).length}</strong> avec prix</span>
        <span><strong style={{ color: '#2a2520' }}>{products.filter(p => p.imageUrl).length}</strong> avec image</span>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 24px' }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#8a8278' }}>Chargement du stock…</div>}

        {error && !loading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>⚠</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20 }}>Erreur</h3>
            <p style={{ color: '#8a8278', fontSize: 13 }}>{error}</p>
            <button onClick={loadStock} style={{ ...btnPrimary, marginTop: 12 }}>Réessayer</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#8a8278' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#2a2520' }}>Aucun produit</h3>
            <p style={{ fontSize: 13 }}>{search ? 'Aucun résultat' : 'Le stock est vide'}</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {filtered.map(p => (
              <div key={p.id || p.rowIndex} style={{ background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', background: '#f0ede8' }} onError={e => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{ width: '100%', height: 180, background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8c0b4', fontSize: 32 }}>◇</div>
                )}
                <div style={{ padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 500 }}>{p.title || 'Sans nom'}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#8b7355' }}>{p.price ? fmtPrice(p.price) + ' €' : '—'}</span>
                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8a8278', padding: '2px 8px', border: '1px solid #e5e0d8', borderRadius: 999 }}>{p.category}</span>
                  </div>
                  {p.description && <div style={{ fontSize: 12, color: '#8a8278', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>}
                </div>
                <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setDeleteTarget(p)} style={{ color: '#b33a3a', background: 'transparent', border: '1px solid transparent', padding: '4px 8px', fontSize: 12, cursor: 'pointer', borderRadius: 4 }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e0d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, margin: 0 }}>Ajouter un produit</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a8278' }}>×</button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#8a8278', marginBottom: 4, textTransform: 'uppercase' }}>Nom du produit *</label>
                <input type="text" required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })} style={inputStyle} placeholder="Ex: Collier Soleil" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#8a8278', marginBottom: 4, textTransform: 'uppercase' }}>Type *</label>
                <select value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })} style={inputStyle}>
                  <option value="Collier">Collier</option>
                  <option value="Bracelet">Bracelet</option>
                  <option value="Boucles">Boucles</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#8a8278', marginBottom: 4, textTransform: 'uppercase' }}>Prix (€)</label>
                <input type="text" value={addForm.price} onChange={e => setAddForm({ ...addForm, price: e.target.value })} style={inputStyle} placeholder="Ex: 120" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#8a8278', marginBottom: 4, textTransform: 'uppercase' }}>Description</label>
                <textarea value={addForm.desc} onChange={e => setAddForm({ ...addForm, desc: e.target.value })} style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Description…" />
              </div>
              {addSuccess && <p style={{ color: '#3a7a4a', fontSize: 13, textAlign: 'center', marginBottom: 8 }}>Produit ajouté ! Rafraîchissement…</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={btnDefault}>Annuler</button>
                <button type="submit" disabled={adding} style={btnPrimary}>{adding ? 'Envoi…' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 380 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e0d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, margin: 0 }}>Supprimer</h2>
              <button onClick={() => setDeleteTarget(null)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a8278' }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <p>Supprimer <strong>{deleteTarget.title}</strong> ?</p>
              <p style={{ fontSize: 12, color: '#8a8278', marginTop: 8 }}>Cette action est irréversible.</p>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e0d8', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={btnDefault}>Annuler</button>
              <button onClick={confirmDelete} disabled={deleting} style={{ ...btnPrimary, background: '#b33a3a', borderColor: '#b33a3a' }}>{deleting ? 'Suppression…' : 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───
const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #e5e0d8',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  background: '#faf9f7',
  color: '#2a2520',
};

const btnPrimary = {
  padding: '8px 16px',
  background: '#8b7355',
  color: '#fff',
  border: '1px solid #8b7355',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const btnDefault = {
  padding: '8px 16px',
  background: '#fff',
  color: '#2a2520',
  border: '1px solid #e5e0d8',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const btnSm = {
  padding: '5px 10px',
  background: '#fff',
  color: '#2a2520',
  border: '1px solid #e5e0d8',
  borderRadius: 8,
  fontSize: 12,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const catBtn = {
  padding: '6px 14px',
  border: '1px solid #e5e0d8',
  borderRadius: 999,
  background: '#fff',
  color: '#8a8278',
  fontSize: 12,
  fontFamily: 'inherit',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};

const catBtnActive = {
  padding: '6px 14px',
  border: '1px solid #8b7355',
  borderRadius: 999,
  background: '#8b7355',
  color: '#fff',
  fontSize: 12,
  fontFamily: 'inherit',
  cursor: 'pointer',
  textTransform: 'uppercase',
  letterSpacing: 0.3,
};
