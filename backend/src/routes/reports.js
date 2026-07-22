import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireStaff } from "../lib/auth.js";
import { computeStockMap } from "../lib/stock.js";

export const reportsRouter = Router();

function parseRange(req) {
  const { from, to } = req.query;
  const range = {};
  if (from) range.gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.lte = end;
  }
  return Object.keys(range).length ? range : undefined;
}

// Vue d'ensemble pour le tableau de bord
reportsRouter.get("/dashboard", requireAuth, requireStaff, async (req, res) => {
  const items = await prisma.item.findMany({ where: { active: true } });
  const stock = await computeStockMap();

  const withStock = items.map((it) => ({
    id: it.id,
    name: it.name,
    category: it.category,
    unit: it.unit,
    minThreshold: it.minThreshold,
    stock: stock.get(it.id) || 0,
  }));

  const lowStock = withStock
    .filter((it) => it.stock <= it.minThreshold)
    .sort((a, b) => a.stock - b.stock);

  const [purchaseCount, issueCount, peopleCount] = await Promise.all([
    prisma.purchase.count(),
    prisma.issue.count(),
    prisma.person.count({ where: { active: true } }),
  ]);

  const recentIssues = await prisma.issue.findMany({
    include: { item: true, person: true },
    orderBy: { date: "desc" },
    take: 8,
  });

  return res.json({
    success: true,
    data: {
      totals: {
        items: items.length,
        totalUnits: withStock.reduce((s, it) => s + it.stock, 0),
        lowStockCount: lowStock.length,
        purchaseCount,
        issueCount,
        peopleCount,
      },
      lowStock,
      recentIssues,
    },
  });
});

// Liste de réapprovisionnement
reportsRouter.get("/low-stock", requireAuth, requireStaff, async (req, res) => {
  const items = await prisma.item.findMany({ where: { active: true } });
  const stock = await computeStockMap();
  const data = items
    .map((it) => ({ ...it, stock: stock.get(it.id) || 0, suggested: Math.max(it.minThreshold * 2 - (stock.get(it.id) || 0), it.minThreshold) }))
    .filter((it) => it.stock <= it.minThreshold)
    .sort((a, b) => a.stock - b.stock);
  return res.json({ success: true, data });
});

// Consommation par personne ou département
reportsRouter.get("/consumption", requireAuth, async (req, res) => {
  const groupBy = req.query.groupBy === "department" ? "department" : "person";
  const dateRange = parseRange(req);
  const issues = await prisma.issue.findMany({
    where: dateRange ? { date: dateRange } : {},
    include: { person: true, item: true },
  });

  const groups = new Map();
  for (const iss of issues) {
    let key, label;
    if (groupBy === "department") {
      label = iss.person?.department || "Non attribué";
      key = label;
    } else {
      label = iss.person?.name || "Non attribué";
      key = iss.person?.id ?? "none";
    }
    if (!groups.has(key)) groups.set(key, { key, label, totalQuantity: 0, issueCount: 0, items: {} });
    const g = groups.get(key);
    g.totalQuantity += iss.quantity;
    g.issueCount += 1;
    g.items[iss.item.name] = (g.items[iss.item.name] || 0) + iss.quantity;
  }

  const data = Array.from(groups.values())
    .map((g) => ({
      ...g,
      items: Object.entries(g.items)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty),
    }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity);

  return res.json({ success: true, data });
});

// Historique des mouvements (achats + sorties fusionnés)
reportsRouter.get("/movements", requireAuth, requireStaff, async (req, res) => {
  const { itemId, personId, type } = req.query;
  const dateRange = parseRange(req);
  const baseWhere = {};
  if (itemId) baseWhere.itemId = parseInt(itemId, 10);
  if (dateRange) baseWhere.date = dateRange;

  const movements = [];

  if (type !== "issue") {
    const purchases = await prisma.purchase.findMany({
      where: baseWhere,
      include: { item: true, createdBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    for (const p of purchases) {
      movements.push({
        id: `P${p.id}`,
        rawId: p.id,
        type: "ACHAT",
        date: p.date,
        itemName: p.item.name,
        unit: p.item.unit,
        quantity: p.quantity,
        target: p.supplier ? `Fournisseur : ${p.supplier}` : "",
        note: p.note || "",
        by: p.createdBy?.name || "",
      });
    }
  }

  if (type !== "purchase") {
    const issueWhere = { ...baseWhere };
    if (personId) issueWhere.personId = parseInt(personId, 10);
    const issues = await prisma.issue.findMany({
      where: issueWhere,
      include: { item: true, person: true, createdBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    });
    for (const i of issues) {
      movements.push({
        id: `I${i.id}`,
        rawId: i.id,
        type: "SORTIE",
        date: i.date,
        itemName: i.item.name,
        unit: i.item.unit,
        quantity: i.quantity,
        target: i.person ? `${i.person.name}${i.person.department ? " (" + i.person.department + ")" : ""}` : "Non attribué",
        note: i.note || "",
        by: i.createdBy?.name || "",
      });
    }
  }

  movements.sort((a, b) => new Date(b.date) - new Date(a.date));
  return res.json({ success: true, data: movements });
});

// Dépenses dans le temps (basé sur unitPrice optionnel des achats)
reportsRouter.get("/spending", requireAuth, requireStaff, async (req, res) => {
  const dateRange = parseRange(req);
  const purchases = await prisma.purchase.findMany({
    where: dateRange ? { date: dateRange } : {},
    include: { item: true },
  });

  const months = new Map();
  let totalWithPrice = 0;
  let missingPriceCount = 0;

  for (const p of purchases) {
    const d = new Date(p.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!months.has(key)) months.set(key, { month: key, total: 0, count: 0 });
    const m = months.get(key);
    m.count += 1;
    if (p.unitPrice != null) {
      const cost = p.unitPrice * p.quantity;
      m.total += cost;
      totalWithPrice += cost;
    } else {
      missingPriceCount += 1;
    }
  }

  const data = Array.from(months.values()).sort((a, b) => a.month.localeCompare(b.month));
  return res.json({
    success: true,
    data: { byMonth: data, totalWithPrice, missingPriceCount },
  });
});
