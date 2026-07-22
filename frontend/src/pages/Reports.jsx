import { useEffect, useState } from "react";
import { api } from "../api.js";
import { catLabel } from "../constants.js";

const TABS = [
  { key: "low", label: "🔴 Réapprovisionnement" },
  { key: "consumption", label: "👤 Consommation" },
  { key: "spending", label: "💰 Dépenses" },
];

export function Reports() {
  const [tab, setTab] = useState("low");
  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Rapports</h1>
      <div className="inline-list" style={{ gap: 8 }}>
        {TABS.map((t) => (
          <button key={t.key}
            className={`btn ${tab === t.key ? "" : "secondary"} small`}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab === "low" && <LowStock />}
      {tab === "consumption" && <Consumption />}
      {tab === "spending" && <Spending />}
    </div>
  );
}

function useRange() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const qs = () => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    return q.toString();
  };
  const controls = (
    <div className="filters">
      <div className="field"><label>Du</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
      <div className="field"><label>Au</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
    </div>
  );
  return { qs, controls };
}

function LowStock() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/reports/low-stock").then((r) => setData(r.data)).catch((e) => setError(e.message)); }, []);
  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="spinner">Chargement…</div>;
  return (
    <div className="card">
      <h2>Articles à réapprovisionner ({data.length})</h2>
      {data.length === 0 ? <div className="empty">Aucun article sous le seuil. 👍</div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Article</th><th>Catégorie</th><th className="right">Stock actuel</th><th className="right">Seuil</th><th className="right">Qté suggérée</th><th>Emplacement</th></tr></thead>
            <tbody>
              {data.map((it) => (
                <tr key={it.id} className="row-low">
                  <td><strong>{it.name}</strong></td>
                  <td><span className="badge gray">{catLabel(it.category)}</span></td>
                  <td className="right">{it.stock} {it.unit}</td>
                  <td className="right muted">{it.minThreshold}</td>
                  <td className="right"><strong>{it.suggested}</strong></td>
                  <td className="muted">{it.location || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Consumption() {
  const [groupBy, setGroupBy] = useState("person");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const { qs, controls } = useRange();

  function load() {
    const q = new URLSearchParams(qs());
    q.set("groupBy", groupBy);
    api(`/reports/consumption?${q.toString()}`).then((r) => setData(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, [groupBy]);

  return (
    <div className="card">
      <div className="page-actions">
        <h2 style={{ margin: 0 }}>Consommation par {groupBy === "person" ? "personne" : "département"}</h2>
        <div className="inline-list">
          <button className={`btn small ${groupBy === "person" ? "" : "secondary"}`} onClick={() => setGroupBy("person")}>Par personne</button>
          <button className={`btn small ${groupBy === "department" ? "" : "secondary"}`} onClick={() => setGroupBy("department")}>Par département</button>
        </div>
      </div>
      {controls}
      <button className="btn secondary small" onClick={load} style={{ marginBottom: 14 }}>Appliquer la période</button>
      {error && <div className="alert error">{error}</div>}
      {!data ? <div className="spinner">Chargement…</div> : data.length === 0 ? <div className="empty">Aucune donnée.</div> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>{groupBy === "person" ? "Personne" : "Département"}</th><th className="right">Total unités</th><th className="right">Nb sorties</th><th>Détail</th></tr></thead>
            <tbody>
              {data.map((g) => (
                <tr key={g.key}>
                  <td><strong>{g.label}</strong></td>
                  <td className="right">{g.totalQuantity}</td>
                  <td className="right muted">{g.issueCount}</td>
                  <td>
                    <div className="inline-list">
                      {g.items.slice(0, 5).map((it) => (
                        <span key={it.name} className="badge gray">{it.name} ×{it.qty}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Spending() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const { qs, controls } = useRange();
  function load() {
    api(`/reports/spending?${qs()}`).then((r) => setData(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);
  const max = data ? Math.max(1, ...data.byMonth.map((m) => m.total)) : 1;

  return (
    <div className="card">
      <h2>Dépenses par mois</h2>
      {controls}
      <button className="btn secondary small" onClick={load} style={{ marginBottom: 14 }}>Appliquer la période</button>
      {error && <div className="alert error">{error}</div>}
      {!data ? <div className="spinner">Chargement…</div> : (
        <>
          {data.missingPriceCount > 0 && (
            <div className="alert warn">
              {data.missingPriceCount} achat(s) sans prix unitaire ne sont pas comptés. Renseignez le prix lors de l'achat pour un suivi complet.
            </div>
          )}
          <p><strong>Total (avec prix) : {data.totalWithPrice.toLocaleString("fr-FR")} MAD</strong></p>
          {data.byMonth.length === 0 ? <div className="empty">Aucune donnée.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Mois</th><th className="right">Nb achats</th><th className="right">Total</th><th style={{ width: "40%" }}></th></tr></thead>
                <tbody>
                  {data.byMonth.map((m) => (
                    <tr key={m.month}>
                      <td>{m.month}</td>
                      <td className="right muted">{m.count}</td>
                      <td className="right">{m.total.toLocaleString("fr-FR")} MAD</td>
                      <td>
                        <div style={{ background: "var(--accent)", height: 14, borderRadius: 4, width: `${(m.total / max) * 100}%`, minWidth: m.total > 0 ? 4 : 0 }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
