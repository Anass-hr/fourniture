import { useEffect, useState } from "react";
import { api } from "../api.js";
import { formatDate, roleLabel } from "../constants.js";

const EMPTY = { email: "", name: "", password: "", role: "STAFF" };

export function Users() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await api("/users");
    setUsers(res.data);
  }
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);

  async function save() {
    setSaving(true); setError("");
    try {
      const d = modal.data;
      if (modal.mode === "new") await api("/users", { method: "POST", body: d });
      else await api(`/users/${d.id}`, { method: "PUT", body: d });
      setModal(null);
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  async function toggle(u) {
    try {
      await api(`/users/${u.id}`, { method: "PUT", body: { active: !u.active } });
      await load();
    } catch (e) { setError(e.message); }
  }

  const set = (k, v) => setModal((m) => ({ ...m, data: { ...m.data, [k]: v } }));

  return (
    <div className="stack">
      <div className="page-actions">
        <h1 style={{ margin: 0 }}>Utilisateurs</h1>
        <button className="btn" onClick={() => setModal({ mode: "new", data: { ...EMPTY } })}>+ Nouvel utilisateur</button>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>
        Les <strong>administrateurs</strong> gèrent le catalogue et les utilisateurs. Le <strong>personnel</strong> enregistre achats et sorties. La <strong>consultation</strong> voit uniquement la consommation (lecture seule).
      </p>
      {error && <div className="alert error">{error}</div>}

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th>Créé le</th><th></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td className="muted">{u.email}</td>
                  <td>
                    {u.role === "ADMIN"
                      ? <span className="badge blue">Administrateur</span>
                      : u.role === "VIEWER"
                        ? <span className="badge amber">Consultation</span>
                        : <span className="badge gray">Personnel</span>}
                  </td>
                  <td>{u.active ? <span className="badge green">Actif</span> : <span className="badge red">Désactivé</span>}</td>
                  <td className="muted">{formatDate(u.createdAt)}</td>
                  <td className="right">
                    <button className="btn-link" onClick={() => setModal({ mode: "edit", data: { id: u.id, name: u.name, role: u.role, password: "" } })}>Modifier</button>
                    {" · "}
                    <button className="btn-link" onClick={() => toggle(u)}>{u.active ? "Désactiver" : "Activer"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h2>{modal.mode === "new" ? "Nouvel utilisateur" : "Modifier l'utilisateur"}</h2>
            {modal.mode === "new" && (
              <div className="field">
                <label>Email *</label>
                <input type="email" value={modal.data.email} onChange={(e) => set("email", e.target.value)} autoFocus />
              </div>
            )}
            <div className="field">
              <label>Nom *</label>
              <input value={modal.data.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="field">
              <label>Rôle</label>
              <select value={modal.data.role} onChange={(e) => set("role", e.target.value)}>
                <option value="STAFF">Personnel — enregistre achats et sorties</option>
                <option value="VIEWER">Consultation — voit seulement la consommation</option>
                <option value="ADMIN">Administrateur — accès complet</option>
              </select>
            </div>
            <div className="field">
              <label>{modal.mode === "new" ? "Mot de passe *" : "Nouveau mot de passe (laisser vide pour conserver)"}</label>
              <input type="password" value={modal.data.password} onChange={(e) => set("password", e.target.value)} placeholder="Min. 6 caractères" />
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
