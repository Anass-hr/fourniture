import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin, requireStaff } from "../lib/auth.js";
import { computeStockForItem } from "../lib/stock.js";

export const purchasesRouter = Router();

// Enregistre un achat (entrée de stock)
purchasesRouter.post("/", requireAuth, requireStaff, async (req, res) => {
  const { itemId, quantity, unitPrice, supplier, orderedBy, note, date } = req.body || {};
  const item = await prisma.item.findUnique({ where: { id: parseInt(itemId, 10) } });
  if (!item) return res.status(404).json({ success: false, error: "Article introuvable." });

  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(qty) || qty <= 0) {
    return res.status(400).json({ success: false, error: "La quantité doit être un nombre positif." });
  }

  // Détection de doublon : même article + quantité + date (avertissement, pas blocage)
  let warning = null;
  const parsedDate = date ? new Date(date) : new Date();
  const dayStart = new Date(parsedDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(parsedDate);
  dayEnd.setHours(23, 59, 59, 999);
  const dup = await prisma.purchase.findFirst({
    where: { itemId: item.id, quantity: qty, date: { gte: dayStart, lte: dayEnd } },
  });
  if (dup) {
    warning = "Un achat identique existe déjà pour cette date. Vérifiez qu'il ne s'agit pas d'un doublon.";
  }

  const purchase = await prisma.purchase.create({
    data: {
      itemId: item.id,
      quantity: qty,
      unitPrice: unitPrice != null && unitPrice !== "" ? parseFloat(unitPrice) : null,
      supplier: supplier ? String(supplier).trim() : null,
      orderedBy: orderedBy ? String(orderedBy).trim() : null,
      note: note ? String(note).trim() : null,
      date: parsedDate,
      createdById: req.user.id,
    },
  });
  return res.status(201).json({ success: true, data: purchase, warning });
});

// Supprime un achat saisi par erreur (admin uniquement)
purchasesRouter.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const purchase = await prisma.purchase.findUnique({ where: { id }, include: { item: true } });
  if (!purchase) return res.status(404).json({ success: false, error: "Achat introuvable." });

  // Retirer cet achat ne doit pas rendre le stock négatif :
  // cela signifierait que les sorties déjà enregistrées en dépendent.
  const current = await computeStockForItem(purchase.itemId);
  if (current - purchase.quantity < 0) {
    return res.status(400).json({
      success: false,
      error:
        `Impossible de supprimer cet achat : le stock de « ${purchase.item.name} » deviendrait négatif ` +
        `(${current - purchase.quantity}). Supprimez d'abord les sorties concernées.`,
    });
  }

  await prisma.purchase.delete({ where: { id } });
  return res.json({ success: true, data: { id } });
});

purchasesRouter.get("/", requireAuth, async (req, res) => {
  const purchases = await prisma.purchase.findMany({
    include: { item: true, createdBy: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 200,
  });
  return res.json({ success: true, data: purchases });
});
