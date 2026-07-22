import { NavLink } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { roleLabel } from "../constants.js";

const NAV = [
  { to: "/", label: "Tableau de bord", icon: "▦", end: true, roles: ["ADMIN", "STAFF"] },
  { to: "/sortie", label: "Nouvelle sortie", icon: "↗", roles: ["ADMIN", "STAFF"] },
  { to: "/achat", label: "Nouvel achat", icon: "↘", roles: ["ADMIN", "STAFF"] },
  { to: "/historique", label: "Historique", icon: "≣", roles: ["ADMIN", "STAFF"] },
  { to: "/rapports", label: "Rapports", icon: "▤", roles: ["ADMIN", "STAFF"] },
  { to: "/consommation", label: "Consommation", icon: "▤", roles: ["VIEWER"] },
  { to: "/personnes", label: "Personnes", icon: "☺", roles: ["ADMIN", "STAFF"] },
  { to: "/catalogue", label: "Catalogue", icon: "▢", roles: ["ADMIN"] },
  { to: "/utilisateurs", label: "Utilisateurs", icon: "⚿", roles: ["ADMIN"] },
];

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const items = NAV.filter((n) => n.roles.includes(user?.role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>📦</span>
          <span>OfficeStock<small>Gestion des fournitures</small></span>
        </div>
        <nav className="nav">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="nav-icon">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-name">{user?.name}</div>
          <div className="role-tag">{roleLabel(user?.role)}</div>
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </aside>
      <div className="main">
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
