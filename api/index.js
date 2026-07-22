// Point d'entrée pour Vercel : expose l'API Express comme fonction serverless.
// En local, c'est backend/src/server.js qui est utilisé à la place.
import { app } from "../backend/src/app.js";

export default app;
