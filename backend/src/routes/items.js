import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../lib/auth.js";
import { computeStockMap } from "../lib/stock.js";

export const itemsRouter = Router();

export const CATEGORIES = [
  "FOURNITURE",
  "PAPETERIE",
  "INFORMATIQUE",
  "NETTOYAGE",
  "CUISINE",
  "AUTRE",
];

// Liste des articles avec stock courant
itemsRouter.get("/", requireAuth, async (req, res) => {
  const includeInactive = req.query.all === "1";
  const items = await prisma.item.findMany({
    where: includeInactive ? {} : { active: true },
    orderBy: { name: "asc" },
  });
  const stock = await computeStockMap();
  const data = items.map((it) => {
    const current = stock.get(it.id) || 0;
    return {
      ...it,
      stock: current,
      low: current <= it.minThreshold,
    };
  });
  return res.json({ success: true, data });
});

itemsRouter.get("/categories", requireAuth, (req, res) => {
  return res.json({ success: true, data: CATEGORIES });
});

itemsRouter.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, category, unit, minThreshold, location } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, error: "Le nom de l'article est requis." });
  }
  const item = await prisma.item.create({
    data: {
      name: String(name).trim(),
      category: CATEGORIES.includes(category) ? category : "AUTRE",
      unit: unit ? String(unit).trim() : "pièce",
      minThreshold: Number.isFinite(+minThreshold) ? Math.max(0, parseInt(minThreshold, 10)) : 0,
      location: location ? String(location).trim() : null,
    },
  });
  return res.status(201).json({ success: true, data: item });
});

itemsRouter.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, category, unit, minThreshold, location, active } = req.body || {};
  const exists = await prisma.item.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ success: false, error: "Article introuvable." });
  const item = await prisma.item.update({
    where: { id },
    data: {
      name: name != null ? String(name).trim() : exists.name,
      category: category && CATEGORIES.includes(category) ? category : exists.category,
      unit: unit != null ? String(unit).trim() : exists.unit,
      minThreshold:
        minThreshold != null ? Math.max(0, parseInt(minThreshold, 10) || 0) : exists.minThreshold,
      location: location !== undefined ? (location ? String(location).trim() : null) : exists.location,
      active: typeof active === "boolean" ? active : exists.active,
    },
  });
  return res.json({ success: true, data: item });
});

// Désactivation (on ne supprime jamais pour préserver l'historique)
itemsRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const exists = await prisma.item.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ success: false, error: "Article introuvable." });
  await prisma.item.update({ where: { id }, data: { active: false } });
  return res.json({ success: true, data: { id } });
});
