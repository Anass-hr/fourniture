import "dotenv/config";
import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.js";
import { itemsRouter } from "./routes/items.js";
import { peopleRouter } from "./routes/people.js";
import { purchasesRouter } from "./routes/purchases.js";
import { issuesRouter } from "./routes/issues.js";
import { reportsRouter } from "./routes/reports.js";
import { usersRouter } from "./routes/users.js";

// Construit et exporte l'application Express (sans démarrer le serveur).
// Utilisée par server.js (exécution locale) et par api/index.js (Vercel).
export const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ success: true, data: { status: "ok" } }));

app.use("/api/auth", authRouter);
app.use("/api/items", itemsRouter);
app.use("/api/people", peopleRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/users", usersRouter);

// Gestion centralisée des erreurs (messages en français)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Erreur interne du serveur." });
});
