import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { catLabel, formatDateTime } from "../constants.js";

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/reports/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="spinner">Chargement du tableau de bord…</div>;

  const { totals, lowStock, recentIssues } = data;

  return (
    <div className="stack">
      <div className="page-actions">
        <h1 style={{ margin: 0 }}>Tableau de bord</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" to="/sortie">↗ Nouvelle sortie</Link>
          <Link className="btn secondary" to="/achat">↘ Nouvel achat</Link>
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card stat">
          <div className="value">{totals.items}</div>
          <div className="label">Articles au catalogue</div>
        </div>
        <div className="card stat">
          <div className="value">{totals.totalUnits}</div>
          <div className="label">Unités en stock</div>
        </div>
        <div className={`card stat ${totals.lowStockCount > 0 ? "alert" : ""}`}>
          <div className="value">{totals.lowStockCount}</div>
          <div className="label">Articles en stock bas</div>
        </div>
        <div className="card stat">
          <div className="value">{totals.peopleCount}</div>
          <div className="label">Personnes enregistrées</div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h2>🔴 À réapprovisionner</h2>
          {lowStock.length === 0 ? (
            <div className="empty">Aucun article en stock bas. 👍</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Article</th><th>Catégorie</th><th className="right">Stock</th><th className="right">Seuil</th></tr>
                </thead>
                <tbody>
                  {lowStock.map((it) => (
                    <tr key={it.id} className="row-low">
                      <td>{it.name}</td>
                      <td><span className="badge gray">{catLabel(it.category)}</span></td>
                      <td className="right"><strong>{it.stock}</strong> {it.unit}</td>
                      <td className="right muted">{it.minThreshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Dernières sorties</h2>
          {recentIssues.length === 0 ? (
            <div className="empty">Aucune sortie enregistrée.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Article</th><th>Attribué à</th><th className="right">Qté</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {recentIssues.map((iss) => (
                    <tr key={iss.id}>
                      <td>{iss.item.name}</td>
                      <td>{iss.person ? iss.person.name : <span className="muted">Non attribué</span>}</td>
                      <td className="right">{iss.quantity}</td>
                      <td className="muted">{formatDateTime(iss.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
