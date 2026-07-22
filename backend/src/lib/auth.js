import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const EXPIRES_IN = "12h";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: EXPIRES_IN }
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: "Authentification requise." });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Session invalide ou expirée." });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ success: false, error: "Accès réservé aux administrateurs." });
  }
  next();
}

// ADMIN ou STAFF peuvent enregistrer des mouvements ; le rôle VIEWER (consultation) non.
export function requireStaff(req, res, next) {
  if (!req.user || (req.user.role !== "ADMIN" && req.user.role !== "STAFF")) {
    return res.status(403).json({ success: false, error: "Action non autorisée pour votre rôle (consultation seule)." });
  }
  next();
}
