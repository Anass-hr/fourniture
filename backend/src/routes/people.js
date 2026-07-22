import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff } from "../lib/auth.js";

export const peopleRouter = Router();

peopleRouter.get("/", requireAuth, async (req, res) => {
  const includeInactive = req.query.all === "1";
  const people = await prisma.person.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { name: "asc" },
  });
  return res.json({ success: true, data: people });
});

peopleRouter.post("/", requireAuth, requireStaff, async (req, res) => {
  const { name, department } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, error: "Le nom de la personne est requis." });
  }
  const person = await prisma.person.create({
    data: {
      name: String(name).trim(),
      department: department ? String(department).trim() : null,
    },
  });
  return res.status(201).json({ success: true, data: person });
});

peopleRouter.put("/:id", requireAuth, requireStaff, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const exists = await prisma.person.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ success: false, error: "Personne introuvable." });
  const { name, department, active } = req.body || {};
  const person = await prisma.person.update({
    where: { id },
    data: {
      name: name != null ? String(name).trim() : exists.name,
      department:
        department !== undefined ? (department ? String(department).trim() : null) : exists.department,
      active: typeof active === "boolean" ? active : exists.active,
    },
  });
  return res.json({ success: true, data: person });
});

peopleRouter.delete("/:id", requireAuth, requireStaff, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const exists = await prisma.person.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ success: false, error: "Personne introuvable." });
  await prisma.person.update({ where: { id }, data: { active: false } });
  return res.json({ success: true, data: { id } });
});
