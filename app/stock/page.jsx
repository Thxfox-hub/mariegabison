"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export default function StockPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState('');

  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeCollection, setActiveCollection] = useState('all');

  const [view, setView] = useState('products'); // 'products' | 'collections'

  // Add product modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', type: 'Collier', price: '', desc: '', collection: '' });
  const [addImages, setAddImages] = useState([]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const fileInputRef = useRef(null);

  // Delete product
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Product detail/edit modal
  const [detailProduct, setDetailProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', type: '', price: '', description: '', collection: '' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [detailImageIdx, setDetailImageIdx] = useState(0);

  // Collection modal
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collectionForm, setCollectionForm] = useState({ name: '', description: '', rowIndex: null });
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [collectionError, setCollectionError] = useState('');
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState(null);

  // ─── Auth ───
  const [authLoading, setAuthLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Exponential backoff: 5 first attempts free, then 1s, 2s, 4s, 8s, 16s...
  function getLockoutDelay(attempts) {
    if (attempts <= 5) return 0;
    return Math.pow(2, attempts - 6); // 1, 2, 4, 8, 16, 32...
  }

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const t = password.trim();
    if (!t) return;

    // Check lockout
    const delay = getLockoutDelay(failedAttempts);
    if (delay > 0 && lockoutRemaining > 0) {
      setAuthError(`Trop de tentatives. Réessayez dans ${lockoutRemaining}s`);
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/stock', {
        headers: { Authorization: 'Bearer ' + t },
      });
      if (res.status === 401) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        const newDelay = getLockoutDelay(newAttempts);
        if (newDelay > 0) {
          setLockoutRemaining(newDelay);
          setAuthError(`Mot de passe incorrect. ${newAttempts} tentatives échouées. Attendez ${newDelay}s avant de réessayer.`);
        } else {
          setAuthError(`Mot de passe incorrect (${newAttempts}/5 avant blocage)`);
        }
        setAuthLoading(false);
        return;
      }
      if (!res.ok) {
        setAuthError('Erreur serveur');
        setAuthLoading(false);
        return;
      }
      // Success — reset
      setFailedAttempts(0);
      setLockoutRemaining(0);
      setToken(t);
      setAuthed(true);
      setPassword('');
    } catch {
      setAuthError('Erreur de connexion');
    } finally {
      setAuthLoading(false);
    }
  };

  // ─── Fetch products ───
  const loadStock = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stock', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { setAuthed(false); setToken(''); setAuthError('Mot de passe incorrect'); }
        throw new Error(data.error || 'Erreur');
      }
      setProducts(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ─── Fetch collections ───
  const loadCollections = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/stock/collections', { headers: { Authorization: 'Bearer ' + token } });
      const data = await res.json();
      if (res.ok) setCollections(data.items || []);
    } catch (e) { /* silent */ }
  }, [token]);

  useEffect(() => {
    if (authed) { loadStock(); loadCollections(); }
  }, [authed, loadStock, loadCollections]);

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
      if (!res.ok) throw new Error(data.error);
      setDeleteTarget(null);
      loadStock();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  };

  // ─── Product detail & edit ───
  const openDetail = (product) => {
    setDetailProduct(product);
    setEditMode(false);
    setEditError('');
    setDetailImageIdx(0);
    setEditForm({
      name: product.title || '',
      type: product.type || product.category || '',
      price: product.price || '',
      description: product.description || '',
      collection: product.collection || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!detailProduct) return;
    setEditError('');
    setSavingEdit(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rowIndex: detailProduct.rowIndex,
          name: editForm.name,
          type: editForm.type,
          price: editForm.price,
          description: editForm.description,
          collection: editForm.collection,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditMode(false);
      setDetailProduct(null);
      loadStock();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Image handling ───
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remaining = 5 - addImages.length;
    const toAdd = files.slice(0, remaining);
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result.split(',')[1];
        setAddImages(prev => [...prev, {
          name: file.name,
          mimeType: file.type,
          data: base64,
          preview: ev.target.result,
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => {
    setAddImages(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Add product ───
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!addForm.name.trim()) { setAddError('Le nom est obligatoire'); return; }
    if (addImages.length === 0) { setAddError('Au moins une image est obligatoire'); return; }

    setAdding(true);
    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          type: addForm.type,
          price: addForm.price,
          description: addForm.desc,
          collection: addForm.collection,
          images: addImages.map(img => ({ name: img.name, mimeType: img.mimeType, data: img.data })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAddModal(false);
      setAddForm({ name: '', type: 'Collier', price: '', desc: '', collection: '' });
      setAddImages([]);
      loadStock();
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAdding(false);
    }
  };

  // ─── Collection CRUD ───
  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    setCollectionError('');
    if (!collectionForm.name.trim()) { setCollectionError('Le nom est obligatoire'); return; }
    setCollectionSaving(true);
    try {
      const isEdit = collectionForm.rowIndex !== null;
      const res = await fetch('/api/stock/collections', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? collectionForm : { name: collectionForm.name, description: collectionForm.description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCollectionModal(false);
      setCollectionForm({ name: '', description: '', rowIndex: null });
      loadCollections();
    } catch (e) {
      setCollectionError(e.message);
    } finally {
      setCollectionSaving(false);
    }
  };

  const confirmDeleteCollection = async () => {
    if (!deleteCollectionTarget) return;
    try {
      const res = await fetch('/api/stock/collections?row=' + deleteCollectionTarget.rowIndex, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeleteCollectionTarget(null);
      loadCollections();
    } catch (e) {
      setError(e.message);
    }
  };

  // ─── Filtrage ───
  const categories = [...new Set(products.map(p => p.category || 'Autre'))].sort();
  const collectionNames = collections.map(c => c.name);
  const filtered = products.filter(p => {
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (activeCollection !== 'all' && p.collection !== activeCollection) return false;
    if (search) {
      const hay = (p.title + ' ' + p.description + ' ' + p.category + ' ' + p.collection).toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const fmtPrice = (p) => {
    const n = parseFloat(String(p).replace(/[€\s]/g, '').replace(',', '.'));
    return isNaN(n) ? p : n.toFixed(2).replace('.', ',');
  };

  // ═══════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div style={loginWrap}>
        <div style={loginCard}>
          <h1 style={brandTitle}>Marie Gabison Paris</h1>
          <p style={brandSub}>Gestion du stock</p>
          <form onSubmit={handleLogin}>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input type={showPassword ? 'text' : 'password'} placeholder="Mot de passe" value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={lockoutRemaining > 0}
                style={{ ...loginInput, marginBottom: 0, paddingRight: 40, opacity: lockoutRemaining > 0 ? 0.5 : 1 }} autoFocus />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#8a8278', display: 'flex', alignItems: 'center' }}
                aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {authError && <p style={{ color: '#b33a3a', fontSize: 13, marginBottom: 8 }}>{authError}</p>}
            <button type="submit" disabled={authLoading || lockoutRemaining > 0}
              style={{ ...loginBtn, opacity: authLoading || lockoutRemaining > 0 ? 0.6 : 1, cursor: lockoutRemaining > 0 ? 'not-allowed' : 'pointer' }}>
              {lockoutRemaining > 0 ? `Attendez ${lockoutRemaining}s` : authLoading ? 'Vérification…' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={dashboard}>
      {/* Header */}
      <div style={header}>
        <div>
          <h1 style={brandTitle}>Marie Gabison Paris</h1>
          <p style={brandSub}>Gestion du stock</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setView('products')} style={view === 'products' ? tabActive : tabInactive}>Produits</button>
          <button onClick={() => setView('collections')} style={view === 'collections' ? tabActive : tabInactive}>Collections</button>
          <button onClick={loadStock} style={btnSm} title="Rafraîchir">↻</button>
          <button onClick={() => { setAuthed(false); setToken(''); }} style={btnSm}>Déconnexion</button>
        </div>
      </div>

      {view === 'products' && (
        <>
          {/* Toolbar */}
          <div style={toolbar}>
            <input type="text" placeholder="Rechercher…" value={search}
              onChange={e => setSearch(e.target.value)} style={searchInput} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => setActiveCategory('all')} style={activeCategory === 'all' ? catActive : catBtn}>
                Tout ({products.length})
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={activeCategory === cat ? catActive : catBtn}>
                  {cat} ({products.filter(p => p.category === cat).length})
                </button>
              ))}
            </div>
          </div>

          {/* Collection filter */}
          {collectionNames.length > 0 && (
            <div style={{ ...toolbar, paddingTop: 4, paddingBottom: 4 }}>
              <span style={{ fontSize: 11, color: '#8a8278', textTransform: 'uppercase', letterSpacing: 0.5 }}>Collection:</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setActiveCollection('all')} style={activeCollection === 'all' ? collActive : collBtn}>
                  Toutes
                </button>
                {collectionNames.map(name => (
                  <button key={name} onClick={() => setActiveCollection(name)} style={activeCollection === name ? collActive : collBtn}>
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats + Add button */}
          <div style={{ padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#8a8278' }}>
              <span><strong style={{ color: '#2a2520' }}>{filtered.length}</strong> produit{filtered.length > 1 ? 's' : ''}</span>
              <span><strong style={{ color: '#2a2520' }}>{products.filter(p => p.price).length}</strong> avec prix</span>
              <span><strong style={{ color: '#2a2520' }}>{products.filter(p => p.imageUrl).length}</strong> avec image</span>
            </div>
            <button onClick={() => setShowAddModal(true)} style={btnPrimary}>+ Ajouter un produit</button>
          </div>

          {/* Products grid */}
          <div style={{ padding: '0 24px 24px' }}>
            {loading && <div style={emptyState}>Chargement du stock…</div>}
            {error && !loading && (
              <div style={emptyState}>
                <div style={{ fontSize: 36 }}>⚠</div>
                <h3 style={emptyTitle}>Erreur</h3>
                <p style={{ color: '#8a8278', fontSize: 13 }}>{error}</p>
                <button onClick={loadStock} style={{ ...btnPrimary, marginTop: 12 }}>Réessayer</button>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div style={emptyState}>
                <div style={{ fontSize: 36 }}>📦</div>
                <h3 style={emptyTitle}>Aucun produit</h3>
                <p style={{ color: '#8a8278', fontSize: 13 }}>{search ? 'Aucun résultat' : 'Le stock est vide'}</p>
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div style={productGrid}>
                {filtered.map(p => (
                  <div key={p.id || p.rowIndex} style={{ ...productCard, cursor: 'pointer' }} onClick={() => openDetail(p)}>
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" style={productImg} onError={e => { e.target.style.display = 'none'; }} />
                    ) : (
                      <div style={productImgPlaceholder}>◇</div>
                    )}
                    <div style={productInfo}>
                      <div style={productName}>{p.title || 'Sans nom'}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={productPrice}>{p.price ? fmtPrice(p.price) + ' €' : '—'}</span>
                        <span style={productCat}>{p.category}</span>
                      </div>
                      {p.collection && <span style={collBadge}>{p.collection}</span>}
                      {p.description && <div style={productDesc}>{p.description}</div>}
                    </div>
                    <div style={productActions} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDeleteTarget(p)} style={btnDeleteFull}>Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'collections' && (
        <>
          <div style={{ padding: '8px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#8a8278' }}><strong style={{ color: '#2a2520' }}>{collections.length}</strong> collection{collections.length > 1 ? 's' : ''}</span>
            <button onClick={() => { setCollectionForm({ name: '', description: '', rowIndex: null }); setShowCollectionModal(true); }} style={btnPrimary}>+ Créer une collection</button>
          </div>
          <div style={{ padding: '0 24px 24px' }}>
            {collections.length === 0 && !loading && (
              <div style={emptyState}>
                <div style={{ fontSize: 36 }}>📁</div>
                <h3 style={emptyTitle}>Aucune collection</h3>
                <p style={{ color: '#8a8278', fontSize: 13 }}>Créez votre première collection</p>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
              {collections.map(c => (
                <div key={c.rowIndex} style={collCard}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, fontWeight: 500 }}>{c.name}</div>
                    {c.description && <div style={{ fontSize: 12, color: '#8a8278', marginTop: 4 }}>{c.description}</div>}
                    <div style={{ fontSize: 11, color: '#8a8278', marginTop: 4 }}>
                      {products.filter(p => p.collection === c.name).length} produit(s)
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setCollectionForm({ name: c.name, description: c.description, rowIndex: c.rowIndex }); setShowCollectionModal(true); }} style={btnSm}>Éditer</button>
                    <button onClick={() => setDeleteCollectionTarget(c)} style={btnDeleteFull}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ Add Product Modal ═══ */}
      {showAddModal && (
        <div style={modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>Ajouter un produit</h2>
              <button onClick={() => setShowAddModal(false)} style={closeBtn}>×</button>
            </div>
            <form onSubmit={handleAddSubmit} style={{ padding: 20, maxHeight: '70vh', overflow: 'auto' }}>
              <div style={fieldGroup}>
                <label style={labelStyle}>Nom du produit *</label>
                <input type="text" required value={addForm.name}
                  onChange={e => setAddForm({ ...addForm, name: e.target.value })} style={inputStyle} placeholder="Ex: Collier Soleil" />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Type *</label>
                <select value={addForm.type} onChange={e => setAddForm({ ...addForm, type: e.target.value })} style={inputStyle}>
                  <option value="Collier">Collier</option>
                  <option value="Bracelet">Bracelet</option>
                  <option value="Boucles">Boucles</option>
                  <option value="Bague">Bague</option>
                  <option value="Parure">Parure</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Collection</label>
                <select value={addForm.collection} onChange={e => setAddForm({ ...addForm, collection: e.target.value })} style={inputStyle}>
                  <option value="">— Aucune —</option>
                  {collections.map(c => <option key={c.rowIndex} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Prix (€)</label>
                <input type="text" value={addForm.price}
                  onChange={e => setAddForm({ ...addForm, price: e.target.value })} style={inputStyle} placeholder="Ex: 120" />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Description</label>
                <textarea value={addForm.desc}
                  onChange={e => setAddForm({ ...addForm, desc: e.target.value })}
                  style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} placeholder="Description…" />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Images * (minimum 1, maximum 5)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {addImages.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                      <img src={img.preview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e0d8' }} />
                      <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#b33a3a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                    </div>
                  ))}
                  {addImages.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={uploadBtn}>+</button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} style={{ display: 'none' }} />
                <p style={{ fontSize: 11, color: '#8a8278' }}>{addImages.length} image(s) sélectionnée(s)</p>
              </div>
              {addError && <p style={{ color: '#b33a3a', fontSize: 13, marginBottom: 12 }}>{addError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={btnDefault}>Annuler</button>
                <button type="submit" disabled={adding} style={btnPrimary}>{adding ? 'Envoi…' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Collection Modal ═══ */}
      {showCollectionModal && (
        <div style={modalOverlay} onClick={() => setShowCollectionModal(false)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>{collectionForm.rowIndex ? 'Modifier la collection' : 'Créer une collection'}</h2>
              <button onClick={() => setShowCollectionModal(false)} style={closeBtn}>×</button>
            </div>
            <form onSubmit={handleCollectionSubmit} style={{ padding: 20 }}>
              <div style={fieldGroup}>
                <label style={labelStyle}>Nom *</label>
                <input type="text" required value={collectionForm.name}
                  onChange={e => setCollectionForm({ ...collectionForm, name: e.target.value })} style={inputStyle} placeholder="Ex: Héritage" />
              </div>
              <div style={fieldGroup}>
                <label style={labelStyle}>Description</label>
                <textarea value={collectionForm.description}
                  onChange={e => setCollectionForm({ ...collectionForm, description: e.target.value })}
                  style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Description de la collection…" />
              </div>
              {collectionError && <p style={{ color: '#b33a3a', fontSize: 13, marginBottom: 12 }}>{collectionError}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => setShowCollectionModal(false)} style={btnDefault}>Annuler</button>
                <button type="submit" disabled={collectionSaving} style={btnPrimary}>{collectionSaving ? 'Envoi…' : (collectionForm.rowIndex ? 'Modifier' : 'Créer')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Delete Product Modal ═══ */}
      {deleteTarget && (
        <div style={modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>Supprimer</h2>
              <button onClick={() => setDeleteTarget(null)} style={closeBtn}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <p>Supprimer <strong>{deleteTarget.title}</strong> ?</p>
              <p style={{ fontSize: 12, color: '#8a8278', marginTop: 8 }}>Cette action est irréversible.</p>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e0d8', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} style={btnDefault}>Annuler</button>
              <button onClick={confirmDelete} disabled={deleting} style={btnDeleteFull}>{deleting ? 'Suppression…' : 'Supprimer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Delete Collection Modal ═══ */}
      {deleteCollectionTarget && (
        <div style={modalOverlay} onClick={() => setDeleteCollectionTarget(null)}>
          <div style={modalCard} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>Supprimer la collection</h2>
              <button onClick={() => setDeleteCollectionTarget(null)} style={closeBtn}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <p>Supprimer la collection <strong>{deleteCollectionTarget.name}</strong> ?</p>
              <p style={{ fontSize: 12, color: '#8a8278', marginTop: 8 }}>Les produits assignés ne seront pas supprimés.</p>
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e0d8', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteCollectionTarget(null)} style={btnDefault}>Annuler</button>
              <button onClick={confirmDeleteCollection} style={btnDeleteFull}>Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Product Detail / Edit Modal ═══ */}
      {detailProduct && (
        <div style={modalOverlay} onClick={() => setDetailProduct(null)}>
          <div style={{ ...modalCard, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div style={modalHeader}>
              <h2 style={modalTitle}>{editMode ? 'Modifier le produit' : detailProduct.title || 'Produit'}</h2>
              <button onClick={() => setDetailProduct(null)} style={closeBtn}>×</button>
            </div>

            {/* VIEW MODE */}
            {!editMode && (
              <div style={{ padding: 20, maxHeight: '70vh', overflow: 'auto' }}>
                {/* Image gallery */}
                {detailProduct.images && detailProduct.images.length > 0 ? (
                  <div style={{ marginBottom: 16 }}>
                    <img
                      src={detailProduct.images[detailImageIdx]}
                      alt=""
                      style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, background: '#f0ede8' }}
                    />
                    {detailProduct.images.length > 1 && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto' }}>
                        {detailProduct.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setDetailImageIdx(i)}
                            style={{
                              flexShrink: 0, width: 56, height: 56, borderRadius: 6, overflow: 'hidden',
                              border: i === detailImageIdx ? '2px solid #8b7355' : '2px solid #e5e0d8',
                              padding: 0, cursor: 'pointer', background: '#f6f6f6',
                            }}
                          >
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : detailProduct.imageUrl ? (
                  <img src={detailProduct.imageUrl} alt="" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, marginBottom: 16, background: '#f0ede8' }} />
                ) : (
                  <div style={{ ...productImgPlaceholder, height: 200, marginBottom: 16, borderRadius: 8 }}>◇</div>
                )}

                {/* Details */}
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#8a8278', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nom</span>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18 }}>{detailProduct.title || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#8a8278', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</span>
                    <span style={productCat}>{detailProduct.category || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#8a8278', textTransform: 'uppercase', letterSpacing: 0.5 }}>Prix</span>
                    <span style={{ fontWeight: 500, color: '#8b7355' }}>{detailProduct.price ? fmtPrice(detailProduct.price) + ' €' : '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#8a8278', textTransform: 'uppercase', letterSpacing: 0.5 }}>Collection</span>
                    <span style={collBadge}>{detailProduct.collection || '—'}</span>
                  </div>
                  {detailProduct.description && (
                    <div>
                      <span style={{ fontSize: 11, color: '#8a8278', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>Description</span>
                      <p style={{ fontSize: 13, color: '#5c5c5c', lineHeight: 1.6, margin: 0 }}>{detailProduct.description}</p>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button onClick={() => setDeleteTarget(detailProduct)} style={btnDeleteFull}>Supprimer</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setDetailProduct(null)} style={btnDefault}>Fermer</button>
                    <button onClick={() => setEditMode(true)} style={btnPrimary}>Éditer</button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT MODE */}
            {editMode && (
              <form onSubmit={handleEditSubmit} style={{ padding: 20, maxHeight: '70vh', overflow: 'auto' }}>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Nom</label>
                  <input type="text" required value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Type</label>
                  <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })} style={inputStyle}>
                    <option value="Collier">Collier</option>
                    <option value="Bracelet">Bracelet</option>
                    <option value="Boucles">Boucles</option>
                    <option value="Bague">Bague</option>
                    <option value="Parure">Parure</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Collection</label>
                  <select value={editForm.collection} onChange={e => setEditForm({ ...editForm, collection: e.target.value })} style={inputStyle}>
                    <option value="">— Aucune —</option>
                    {collections.map(c => <option key={c.rowIndex} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Prix (€)</label>
                  <input type="text" value={editForm.price}
                    onChange={e => setEditForm({ ...editForm, price: e.target.value })} style={inputStyle} />
                </div>
                <div style={fieldGroup}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
                </div>
                {editError && <p style={{ color: '#b33a3a', fontSize: 13, marginBottom: 12 }}>{editError}</p>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button type="button" onClick={() => setEditMode(false)} style={btnDefault}>Annuler</button>
                  <button type="submit" disabled={savingEdit} style={btnPrimary}>{savingEdit ? 'Envoi…' : 'Enregistrer'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───
const loginWrap = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f7', padding: 20 };
const loginCard = { background: '#fff', borderRadius: 12, padding: 32, maxWidth: 380, width: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const brandTitle = { fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 28, textAlign: 'center', marginBottom: 4, color: '#2a2520', margin: 0 };
const brandSub = { textAlign: 'center', color: '#8a8278', fontSize: 13, marginBottom: 24, margin: '2px 0 0' };
const loginInput = { width: '100%', padding: '10px 14px', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 14, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' };
const loginBtn = { width: '100%', padding: '10px', background: '#8b7355', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' };

const dashboard = { minHeight: '100vh', background: '#faf9f7', fontFamily: 'Jost, sans-serif', color: '#2a2520' };
const header = { background: '#fff', borderBottom: '1px solid #e5e0d8', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 };
const toolbar = { background: '#fff', borderBottom: '1px solid #e5e0d8', padding: '12px 24px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' };
const searchInput = { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', background: '#faf9f7' };

const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', background: '#faf9f7', color: '#2a2520', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 12, color: '#8a8278', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };
const fieldGroup = { marginBottom: 14 };

const btnPrimary = { padding: '8px 16px', background: '#8b7355', color: '#fff', border: '1px solid #8b7355', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' };
const btnDefault = { padding: '8px 16px', background: '#fff', color: '#2a2520', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer' };
const btnSm = { padding: '5px 10px', background: '#fff', color: '#2a2520', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' };
const btnDeleteFull = { padding: '8px 16px', background: '#b33a3a', color: '#fff', border: '1px solid #b33a3a', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', fontWeight: 500 };

const catBtn = { padding: '6px 14px', border: '1px solid #e5e0d8', borderRadius: 999, background: '#fff', color: '#8a8278', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.3 };
const catActive = { padding: '6px 14px', border: '1px solid #8b7355', borderRadius: 999, background: '#8b7355', color: '#fff', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.3 };
const collBtn = { padding: '4px 12px', border: '1px solid #e5e0d8', borderRadius: 999, background: '#fff', color: '#8a8278', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' };
const collActive = { padding: '4px 12px', border: '1px solid #8b7355', borderRadius: 999, background: '#8b7355', color: '#fff', fontSize: 11, fontFamily: 'inherit', cursor: 'pointer' };

const tabActive = { padding: '6px 16px', background: '#2a2520', color: '#fff', border: '1px solid #2a2520', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' };
const tabInactive = { padding: '6px 16px', background: '#fff', color: '#8a8278', border: '1px solid #e5e0d8', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' };

const productGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 };
const productCard = { background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const productImg = { width: '100%', height: 180, objectFit: 'cover', background: '#f0ede8' };
const productImgPlaceholder = { width: '100%', height: 180, background: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8c0b4', fontSize: 32 };
const productInfo = { padding: 12, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 };
const productName = { fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 500 };
const productPrice = { fontSize: 14, fontWeight: 500, color: '#8b7355' };
const productCat = { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8a8278', padding: '2px 8px', border: '1px solid #e5e0d8', borderRadius: 999 };
const collBadge = { fontSize: 10, color: '#8b7355', padding: '2px 8px', background: '#8b735515', borderRadius: 4, alignSelf: 'flex-start' };
const productDesc = { fontSize: 12, color: '#8a8278', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const productActions = { padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end' };

const collCard = { background: '#fff', border: '1px solid #e5e0d8', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 12 };

const emptyState = { textAlign: 'center', padding: 40, color: '#8a8278' };
const emptyTitle = { fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: '#2a2520', margin: '8px 0' };

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 };
const modalCard = { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' };
const modalHeader = { padding: '16px 20px', borderBottom: '1px solid #e5e0d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const modalTitle = { fontFamily: 'Cormorant Garamond, serif', fontSize: 20, margin: 0 };
const closeBtn = { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#8a8278' };

const uploadBtn = { width: 80, height: 80, border: '2px dashed #e5e0d8', borderRadius: 8, background: '#faf9f7', color: '#8a8278', fontSize: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
