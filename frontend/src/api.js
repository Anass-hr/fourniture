const TOKEN_KEY = "officestock_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Appel API générique. Retourne le corps JSON { success, data, error, warning }.
 * Lève une erreur (avec message français) si la requête échoue.
 */
export async function api(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Impossible de contacter le serveur. Vérifiez que l'API est démarrée.");
  }

  if (res.status === 401) {
    setToken(null);
    if (!path.startsWith("/auth/login")) {
      window.location.href = "/login";
    }
  }

  let json;
  try {
    json = await res.json();
  } catch {
    // Réponse non-JSON : typiquement le serveur API (port 4000) est arrêté et
    // le proxy renvoie une page d'erreur HTML.
    throw new Error(
      "Le serveur API ne répond pas (port 4000). Vérifiez que « npm run dev » " +
      "est bien lancé dans le dossier D:\\FORNITURE, puis réessayez."
    );
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Une erreur est survenue.");
  }
  return json;
}
