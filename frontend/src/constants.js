export const CATEGORY_LABELS = {
  FOURNITURE: "Fourniture de bureau",
  PAPETERIE: "Papeterie",
  INFORMATIQUE: "Informatique",
  NETTOYAGE: "Nettoyage",
  CUISINE: "Cuisine",
  AUTRE: "Autre",
};

export function catLabel(c) {
  return CATEGORY_LABELS[c] || c;
}

export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  STAFF: "Personnel",
  VIEWER: "Consultation",
};

export function roleLabel(r) {
  return ROLE_LABELS[r] || r;
}

export function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(d) {
  if (!d) return "";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
