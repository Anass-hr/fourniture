import { app } from "./app.js";

// Exécution locale (le raccourci OfficeStock.bat / npm run dev).
// Sur Vercel, c'est api/index.js qui est utilisé à la place.
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ API OfficeStock démarrée sur http://localhost:${PORT}`);
});
