import { useEffect, useState } from "react";
import { api } from "../api.js";

// Page de consultation (rôle VIEWER) : consommation en lecture seule.
// Réutilisée aussi dans l'onglet Rapports pour les autres rôles.
export function Consommation() {
  const [groupBy, setGroupBy] = useState("person");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams();
      q.set("groupBy", groupBy);
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const res = await api(`/reports/consumption?${q.toString()}`);
      setData(res.data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [groupBy]);

  const totalUnits = data ? data.reduce((s, g) => s + g.totalQuantity, 0) : 0;

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Consommation des fournitures</h1>
      <p className="muted" style={{ marginTop: -8 }}>
        Qui a consommé quoi, par {groupBy === "person" ? "personne" : "département"}.
      </p>

      <div className="card">
        <div className="page-actions">
          <div className="inline-list">
            <button className={`btn small ${groupBy === "person" ? "" : "secondary"}`} onClick={() => setGroupBy("person")}>Par personne</button>
            <button className={`btn small ${groupBy === "department" ? "" : "secondary"}`} onClick={() => setGroupBy("department")}>Par département</button>
          </div>
        </div>

        <div className="filters">
          <div className="field"><label>Du</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className="field"><label>Au</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <button className="btn secondary small" onClick={load}>Appliquer la période</button>
          {(from || to) && (
            <button className="btn-link" onClick={() => { setFrom(""); setTo(""); setTimeout(load, 0); }}>Réinitialiser</button>
          )}
        </div>

        {error && <div className="alert error">{error}</div>}
        {loading ? <div className="spinner">Chargement…</div> : !data || data.length === 0 ? (
          <div className="empty">Aucune consommation enregistrée pour cette période.</div>
        ) : (
          <>
            <p><strong>Total : {totalUnits} unités distribuées</strong></p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{groupBy === "person" ? "Personne" : "Département"}</th>
                    <th className="right">Total unités</th>
                    <th className="right">Nb sorties</th>
                    <th>Détail par article</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((g) => (
                    <tr key={g.key}>
                      <td><strong>{g.label}</strong></td>
                      <td className="right">{g.totalQuantity}</td>
                      <td className="right muted">{g.issueCount}</td>
                      <td>
                        <div className="inline-list">
                          {g.items.map((it) => (
                            <span key={it.name} className="badge gray">{it.name} ×{it.qty}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
