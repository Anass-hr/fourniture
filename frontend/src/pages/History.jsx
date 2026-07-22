import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { formatDateTime } from "../constants.js";

export function History() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: "", itemId: "", personId: "", from: "", to: "" });

  useEffect(() => {
    Promise.all([api("/items?all=1"), api("/people?all=1")])
      .then(([i, p]) => { setItems(i.data); setPeople(p.data); })
      .catch((e) => setError(e.message));
  }, []);

  async function load() {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) q.set(k, v); });
      const res = await api(`/reports/movements?${q.toString()}`);
      setMovements(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));

  async function doDelete() {
    setDeleting(true); setError("");
    try {
      const path = confirm.type === "ACHAT" ? "/purchases" : "/issues";
      await api(`${path}/${confirm.rawId}`, { method: "DELETE" });
      setConfirm(null);
      await load();
    } catch (e) {
      setError(e.message);
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Historique des mouvements</h1>

      <div className="card">
        <div className="filters">
          <div className="field">
            <label>Type</label>
            <select value={filters.type} onChange={(e) => set("type", e.target.value)}>
              <option value="">Tous</option>
              <option value="purchase">Achats</option>
              <option value="issue">Sorties</option>
            </select>
          </div>
          <div className="field">
            <label>Article</label>
            <select value={filters.itemId} onChange={(e) => set("itemId", e.target.value)}>
              <option value="">Tous</option>
              {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Personne</label>
            <select value={filters.personId} onChange={(e) => set("personId", e.target.value)}>
              <option value="">Toutes</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Du</label>
            <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} />
          </div>
          <div className="field">
            <label>Au</label>
            <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} />
          </div>
          <button className="btn secondary" onClick={() => setFilters({ type: "", itemId: "", personId: "", from: "", to: "" })}>
            Réinitialiser
          </button>
        </div>

        {error && <div className="alert error">{error}</div>}
        {loading ? <div className="spinner">Chargement…</div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Type</th><th>Article</th><th className="right">Qté</th><th>Destination / Source</th><th>Note</th><th>Par</th>{isAdmin && <th></th>}</tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="muted">{formatDateTime(m.date)}</td>
                    <td>
                      {m.type === "ACHAT"
                        ? <span className="badge green">Achat</span>
                        : <span className="badge blue">Sortie</span>}
                    </td>
                    <td>{m.itemName}</td>
                    <td className="right">{m.type === "ACHAT" ? "+" : "−"}{m.quantity} {m.unit}</td>
                    <td>{m.target || "—"}</td>
                    <td className="muted">{m.note || "—"}</td>
                    <td className="muted">{m.by || "—"}</td>
                    {isAdmin && (
                      <td className="right">
                        <button className="btn-link" style={{ color: "var(--red)" }} onClick={() => setConfirm(m)}>
                          Supprimer
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {movements.length === 0 && <tr><td colSpan={isAdmin ? 8 : 7} className="empty">Aucun mouvement pour ces filtres.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal">
            <h2>Supprimer ce mouvement ?</h2>
            <p>
              {confirm.type === "ACHAT" ? "Achat" : "Sortie"} de <strong>{confirm.quantity} {confirm.unit}</strong>
              {" "}de <strong>{confirm.itemName}</strong>
              {confirm.target ? <> — {confirm.target}</> : null}
              {" "}({formatDateTime(confirm.date)}).
            </p>
            <div className="alert warn">
              {confirm.type === "ACHAT"
                ? "Le stock de cet article sera diminué d'autant."
                : "La quantité sera restituée au stock de cet article."}
              {" "}Cette action est définitive.
            </div>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setConfirm(null)}>Annuler</button>
              <button className="btn danger" onClick={doDelete} disabled={deleting}>
                {deleting ? "Suppression…" : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
