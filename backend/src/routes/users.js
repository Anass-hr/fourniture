import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireAdmin);

usersRouter.get("/", async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
  return res.json({ success: true, data: users });
});

usersRouter.post("/", async (req, res) => {
  const { email, name, password, role } = req.body || {};
  if (!email || !name || !password) {
    return res.status(400).json({ success: false, error: "Email, nom et mot de passe requis." });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ success: false, error: "Le mot de passe doit contenir au moins 6 caractères." });
  }
  const cleanEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (existing) {
    return res.status(409).json({ success: false, error: "Un utilisateur avec cet email existe déjà." });
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: String(name).trim(),
      passwordHash,
      role: ["ADMIN", "STAFF", "VIEWER"].includes(role) ? role : "STAFF",
    },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  return res.status(201).json({ success: true, data: user });
});

usersRouter.put("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const exists = await prisma.user.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ success: false, error: "Utilisateur introuvable." });
  const { name, role, active, password } = req.body || {};

  const data = {};
  if (name != null) data.name = String(name).trim();
  if (role) data.role = ["ADMIN", "STAFF", "VIEWER"].includes(role) ? role : "STAFF";
  if (typeof active === "boolean") data.active = active;
  if (password) {
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, error: "Le mot de passe doit contenir au moins 6 caractères." });
    }
    data.passwordHash = await bcrypt.hash(String(password), 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  return res.json({ success: true, data: user });
});
