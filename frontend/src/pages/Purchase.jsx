import { useEffect, useState } from "react";
import { api } from "../api.js";

export function Purchase() {
  const [items, setItems] = useState([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState("");
  const [supplier, setSupplier] = useState("");
  const [orderedBy, setOrderedBy] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadItems() {
    const res = await api("/items");
    setItems(res.data);
  }
  useEffect(() => { loadItems().catch((e) => setError(e.message)); }, []);

  const selected = items.find((i) => i.id === Number(itemId));

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setMsg(null);
    if (!itemId) { setError("Veuillez choisir un article."); return; }
    setSaving(true);
    try {
      const res = await api("/purchases", {
        method: "POST",
        body: { itemId, quantity, unitPrice, supplier, orderedBy, note, date },
      });
      setMsg({ warning: res.warning, name: selected?.name, qty: quantity });
      setQuantity(1); setUnitPrice(""); setNote("");
      await loadItems();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>↘ Nouvel achat</h1>
      <p className="muted" style={{ marginTop: -8 }}>Enregistrer une entrée de stock (fournitures achetées).</p>

      <div className="grid cols-2">
        <form className="card" onSubmit={onSubmit}>
          {error && <div className="alert error">{error}</div>}
          {msg && (
            <div className={`alert ${msg.warning ? "warn" : "success"}`}>
              ✔ Achat enregistré : {msg.qty} × {msg.name}.
              {msg.warning && <div style={{ marginTop: 6 }}>⚠ {msg.warning}</div>}
            </div>
          )}

          <div className="field">
            <label>Article *</label>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} required>
              <option value="">— Choisir un article —</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>{it.name} (stock : {it.stock} {it.unit})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Quantité *</label>
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="field">
              <label>Prix unitaire (facultatif)</label>
              <input type="number" min="0" step="0.01" value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)} placeholder="Ex : 1.50" />
              <small className="muted">Active les rapports de dépenses.</small>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Fournisseur</label>
              <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Ex : Papeterie Centrale" />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Commandé par (facultatif)</label>
            <input value={orderedBy} onChange={(e) => setOrderedBy(e.target.value)} />
          </div>

          <div className="field">
            <label>Note (facultatif)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <button className="btn" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer l'achat"}</button>
        </form>

        <div className="card">
          <h2>Aide</h2>
          <p className="muted">
            Un achat <strong>augmente le stock</strong> de l'article choisi. Le stock affiché partout dans
            l'application est toujours calculé automatiquement à partir des achats moins les sorties.
          </p>
          <p className="muted">
            Le <strong>prix unitaire</strong> est facultatif — renseignez-le si vous souhaitez suivre les
            dépenses dans la page Rapports.
          </p>
          {selected && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: 0 }}><strong>{selected.name}</strong></p>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                Stock actuel : <strong>{selected.stock} {selected.unit}</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
