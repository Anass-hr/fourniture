import { app } from "./app.js";

// Filet de sécurité : une erreur de base de données (ex. Supabase momentanément
// injoignable) provoque un rejet de promesse non géré dans une route async.
// Par défaut Node arrête tout le processus → l'API "ne répond plus".
// Ici on journalise l'erreur mais on garde le serveur en vie : seule la requête
// concernée échoue, le serveur repart dès que la base est de nouveau joignable.
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Rejet de promesse non géré (serveur maintenu en vie) :", reason?.message || reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️  Exception non capturée (serveur maintenu en vie) :", err?.message || err);
});

// Exécution locale (le raccourci OfficeStock.bat / npm run dev).
// Sur Vercel, c'est api/index.js qui est utilisé à la place.
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API OfficeStock démarrée sur http://localhost:${PORT}`);
});
