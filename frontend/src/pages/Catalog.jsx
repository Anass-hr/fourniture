import { useEffect, useState } from "react";
import { api } from "../api.js";
import { CATEGORY_LABELS, catLabel } from "../constants.js";

const EMPTY = { name: "", category: "PAPETERIE", unit: "pièce", minThreshold: 0, location: "" };

export function Catalog() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // { mode, data }
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api("/items?all=1");
    setItems(res.data);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  function openNew() { setModal({ mode: "new", data: { ...EMPTY } }); }
  function openEdit(it) {
    setModal({ mode: "edit", data: { id: it.id, name: it.name, category: it.category, unit: it.unit, minThreshold: it.minThreshold, location: it.location || "", active: it.active } });
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const d = modal.data;
      if (modal.mode === "new") await api("/items", { method: "POST", body: d });
      else await api(`/items/${d.id}`, { method: "PUT", body: d });
      setModal(null);
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function toggleActive(it) {
    try {
      if (it.active) await api(`/items/${it.id}`, { method: "DELETE" });
      else await api(`/items/${it.id}`, { method: "PUT", body: { active: true } });
      await load();
    } catch (e) { setError(e.message); }
  }

  const set = (k, v) => setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

  return (
    <div className="stack">
      <div className="page-actions">
        <h1 style={{ margin: 0 }}>Catalogue des articles</h1>
        <button className="btn" onClick={openNew}>+ Nouvel article</button>
      </div>
      {error && <div className="alert error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Article</th><th>Catégorie</th><th>Unité</th>
                <th className="right">Stock</th><th className="right">Seuil</th>
                <th>Emplacement</th><th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className={it.active && it.low ? "row-low" : ""}>
                  <td><strong>{it.name}</strong></td>
                  <td><span className="badge gray">{catLabel(it.category)}</span></td>
                  <td>{it.unit}</td>
                  <td className="right">{it.stock}</td>
                  <td className="right muted">{it.minThreshold}</td>
                  <td className="muted">{it.location || "—"}</td>
                  <td>{it.active ? <span className="badge green">Actif</span> : <span className="badge gray">Archivé</span>}</td>
                  <td className="right">
                    <button className="btn-link" onClick={() => openEdit(it)}>Modifier</button>
                    {" · "}
                    <button className="btn-link" onClick={() => toggleActive(it)}>
                      {it.active ? "Archiver" : "Réactiver"}
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan="8" className="empty">Aucun article. Créez-en un.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h2>{modal.mode === "new" ? "Nouvel article" : "Modifier l'article"}</h2>
            <div className="field">
              <label>Nom *</label>
              <input value={modal.data.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Catégorie</label>
                <select value={modal.data.category} onChange={(e) => set("category", e.target.value)}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Unité</label>
                <input value={modal.data.unit} onChange={(e) => set("unit", e.target.value)} placeholder="pièce, ramette…" />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Seuil d'alerte (stock bas)</label>
                <input type="number" min="0" value={modal.data.minThreshold}
                  onChange={(e) => set("minThreshold", e.target.value)} />
              </div>
              <div className="field">
                <label>Emplacement</label>
                <input value={modal.data.location} onChange={(e) => set("location", e.target.value)} placeholder="Armoire A…" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setModal(null)}>Annuler</button>
              <button className="btn" onClick={save} disabled={saving}>{saving ? "…" : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
