import { useEffect, useState } from "react";
import { api } from "../api.js";

export function Issue() {
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [personId, setPersonId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPerson, setNewPerson] = useState("");

  async function loadData() {
    const [itemsRes, peopleRes] = await Promise.all([api("/items"), api("/people")]);
    setItems(itemsRes.data);
    setPeople(peopleRes.data);
  }
  useEffect(() => { loadData().catch((e) => setError(e.message)); }, []);

  const selected = items.find((i) => i.id === Number(itemId));

  async function addPerson() {
    if (!newPerson.trim()) return;
    try {
      const res = await api("/people", { method: "POST", body: { name: newPerson } });
      setPeople((p) => [...p, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setPersonId(String(res.data.id));
      setNewPerson("");
    } catch (e) { setError(e.message); }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setMsg(null);
    if (!itemId) { setError("Veuillez choisir un article."); return; }
    setSaving(true);
    try {
      const res = await api("/issues", {
        method: "POST",
        body: { itemId, quantity, personId: personId || null, note, date },
      });
      setMsg({ warning: res.warning, name: selected?.name, qty: quantity });
      setItemId(""); setQuantity(1); setPersonId(""); setNote("");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>↗ Nouvelle sortie</h1>
      <p className="muted" style={{ marginTop: -8 }}>Enregistrer une fourniture donnée à une personne.</p>

      <div className="grid cols-2">
        <form className="card" onSubmit={onSubmit}>
          {error && <div className="alert error">{error}</div>}
          {msg && (
            <div className={`alert ${msg.warning ? "warn" : "success"}`}>
              ✔ Sortie enregistrée : {msg.qty} × {msg.name}.
              {msg.warning && <div style={{ marginTop: 6 }}>⚠ {msg.warning}</div>}
            </div>
          )}

          <div className="field">
            <label>Article *</label>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} required>
              <option value="">— Choisir un article —</option>
              {items.map((it) => (
                <option key={it.id} value={it.id} disabled={it.stock <= 0}>
                  {it.name} (stock : {it.stock} {it.unit}){it.stock <= 0 ? " — épuisé" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Quantité *</label>
              <input type="number" min="1" max={selected?.stock || undefined}
                value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              {selected && <small className="muted">Disponible : {selected.stock} {selected.unit}</small>}
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Attribué à</label>
            <select value={personId} onChange={(e) => setPersonId(e.target.value)}>
              <option value="">— Non attribué —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}{p.department ? ` (${p.department})` : ""}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Note (facultatif)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Motif, projet…" />
          </div>

          <button className="btn" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer la sortie"}</button>
        </form>

        <div className="card">
          <h2>Ajouter une personne</h2>
          <p className="muted" style={{ marginTop: -6 }}>Pas dans la liste ? Ajoutez-la rapidement.</p>
          <div className="field">
            <label>Nom de la personne</label>
            <input value={newPerson} onChange={(e) => setNewPerson(e.target.value)}
              placeholder="Ex : Karim Alaoui"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPerson(); } }} />
          </div>
          <button type="button" className="btn secondary" onClick={addPerson}>+ Ajouter</button>

          {selected && (
            <div style={{ marginTop: 22 }}>
              <h2>Article sélectionné</h2>
              <p style={{ margin: 0 }}><strong>{selected.name}</strong></p>
              <p className="muted" style={{ margin: "4px 0" }}>
                Stock actuel : <strong style={{ color: selected.low ? "var(--red)" : "var(--green)" }}>
                  {selected.stock} {selected.unit}</strong> · Seuil : {selected.minThreshold}
              </p>
              {selected.location && <p className="muted" style={{ margin: 0 }}>Emplacement : {selected.location}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
