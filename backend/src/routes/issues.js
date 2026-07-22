import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin, requireStaff } from "../lib/auth.js";
import { computeStockForItem } from "../lib/stock.js";

export const issuesRouter = Router();

// Enregistre une sortie (attribution à une personne / département)
issuesRouter.post("/", requireAuth, requireStaff, async (req, res) => {
  const { itemId, quantity, personId, note, date } = req.body || {};
  const item = await prisma.item.findUnique({ where: { id: parseInt(itemId, 10) } });
  if (!item) return res.status(404).json({ success: false, error: "Article introuvable." });

  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ success: false, error: "La quantité doit être un nombre positif." });
  }

  let person = null;
  if (personId != null && personId !== "") {
    person = await prisma.person.findUnique({ where: { id: parseInt(personId, 10) } });
    if (!person) return res.status(404).json({ success: false, error: "Personne introuvable." });
  }

  const current = await computeStockForItem(item.id);
  if (qty > current) {
    return res.status(400).json({
      success: false,
      error: `Stock insuffisant pour « ${item.name} ». Disponible : ${current} ${item.unit}.`,
    });
  }

  const issue = await prisma.issue.create({
    data: {
      itemId: item.id,
      quantity: qty,
      personId: person ? person.id : null,
      note: note ? String(note).trim() : null,
      date: date ? new Date(date) : new Date(),
      createdById: req.user.id,
    },
  });

  const remaining = current - qty;
  const warning = remaining <= item.minThreshold
    ? `Stock bas : il reste ${remaining} ${item.unit} de « ${item.name} » (seuil : ${item.minThreshold}).`
    : null;

  return res.status(201).json({ success: true, data: issue, warning });
});

// Supprime une sortie saisie par erreur (admin uniquement).
// Le stock de l'article est automatiquement restitué.
issuesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const issue = await prisma.issue.findUnique({ where: { id } });
  if (!issue) return res.status(404).json({ success: false, error: "Sortie introuvable." });

  await prisma.issue.delete({ where: { id } });
  return res.json({ success: true, data: { id } });
});

issuesRouter.get("/", requireAuth, async (req, res) => {
  const issues = await prisma.issue.findMany({
    include: { item: true, person: true, createdBy: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
  return res.json({ success: true, data: issues });
});
