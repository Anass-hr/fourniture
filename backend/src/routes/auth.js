import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { signToken, requireAuth } from "../lib/auth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email et mot de passe requis." });
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user || !user.active) {
    return res.status(401).json({ success: false, error: "Identifiants incorrects." });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ success: false, error: "Identifiants incorrects." });
  }
  const token = signToken(user);
  return res.json({
    success: true,
    data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } },
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ success: false, error: "Utilisateur introuvable." });
  return res.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});
