import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { Layout } from "./components/Layout.jsx";
import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Issue } from "./pages/Issue.jsx";
import { Purchase } from "./pages/Purchase.jsx";
import { Catalog } from "./pages/Catalog.jsx";
import { People } from "./pages/People.jsx";
import { History } from "./pages/History.jsx";
import { Reports } from "./pages/Reports.jsx";
import { Users } from "./pages/Users.jsx";
import { Consommation } from "./pages/Consommation.jsx";

// Route par défaut selon le rôle : les comptes "consultation" atterrissent
// directement sur la consommation ; les autres sur le tableau de bord.
function homeFor(role) {
  return role === "VIEWER" ? "/consommation" : "/";
}

function Protected({ children, allow }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Layout>{children}</Layout>;
}

const STAFF = ["ADMIN", "STAFF"];
const ADMIN = ["ADMIN"];
const ALL = ["ADMIN", "STAFF", "VIEWER"];

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected allow={STAFF}><Dashboard /></Protected>} />
      <Route path="/sortie" element={<Protected allow={STAFF}><Issue /></Protected>} />
      <Route path="/achat" element={<Protected allow={STAFF}><Purchase /></Protected>} />
      <Route path="/catalogue" element={<Protected allow={ADMIN}><Catalog /></Protected>} />
      <Route path="/personnes" element={<Protected allow={STAFF}><People /></Protected>} />
      <Route path="/historique" element={<Protected allow={STAFF}><History /></Protected>} />
      <Route path="/rapports" element={<Protected allow={STAFF}><Reports /></Protected>} />
      <Route path="/consommation" element={<Protected allow={ALL}><Consommation /></Protected>} />
      <Route path="/utilisateurs" element={<Protected allow={ADMIN}><Users /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
