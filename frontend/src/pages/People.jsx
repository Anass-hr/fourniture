import { useEffect, useState } from "react";
import { api } from "../api.js";

export function People() {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [edit, setEdit] = useState(null);

  async function load() {
    const res = await api("/people?all=1");
    setPeople(res.data);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  async function add(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/people", { method: "POST", body: { name, department } });
      setName(""); setDepartment("");
      await load();
    } catch (e) { setError(e.message); }
  }

  async function saveEdit() {
    try {
      await api(`/people/${edit.id}`, { method: "PUT", body: { name: edit.name, department: edit.department } });
      setEdit(null);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function toggle(p) {
    try {
      if (p.active) await api(`/people/${p.id}`, { method: "DELETE" });
      else await api(`/people/${p.id}`, { method: "PUT", body: { active: true } });
      await load();
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Personnes</h1>
      <p className="muted" style={{ marginTop: -8 }}>Les employés à qui vous attribuez des fournitures.</p>
      {error && <div className="alert error">{error}</div>}

      <div className="grid cols-2">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nom</th><th>Département</th><th>Statut</th><th></th></tr></thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td className="muted">{p.department || "—"}</td>
                    <td>{p.active ? <span className="badge green">Actif</span> : <span className="badge gray">Archivé</span>}</td>
                    <td className="right">
                      <button className="btn-link" onClick={() => setEdit({ id: p.id, name: p.name, department: p.department || "" })}>Modifier</button>
                      {" · "}
                      <button className="btn-link" onClick={() => toggle(p)}>{p.active ? "Archiver" : "Réactiver"}</button>
                    </td>
                  </tr>
                ))}
                {people.length === 0 && <tr><td colSpan="4" className="empty">Aucune personne enregistrée.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <form className="card" onSubmit={add} style={{ alignSelf: "start" }}>
          <h2>Ajouter une personne</h2>
          <div className="field">
            <label>Nom *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Département</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Comptabilité, Commercial…" />
          </div>
          <button className="btn">+ Ajouter</button>
        </form>
      </div>

      {edit && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEdit(null)}>
          <div className="modal">
            <h2>Modifier la personne</h2>
            <div className="field">
              <label>Nom</label>
              <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
            </div>
            <div className="field">
              <label>Département</label>
              <input value={edit.department} onChange={(e) => setEdit({ ...edit, department: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setEdit(null)}>Annuler</button>
              <button className="btn" onClick={saveEdit}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
