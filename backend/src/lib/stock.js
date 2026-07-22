import { prisma } from "./prisma.js";

/**
 * Calcule le stock courant (entrées - sorties) pour tous les articles,
 * ou pour une liste d'articles donnée. Retourne une Map itemId -> stock.
 */
export async function computeStockMap() {
  const [purchases, issues] = await Promise.all([
    prisma.purchase.groupBy({ by: ["itemId"], _sum: { quantity: true } }),
    prisma.issue.groupBy({ by: ["itemId"], _sum: { quantity: true } }),
  ]);

  const map = new Map();
  for (const p of purchases) {
    map.set(p.itemId, (map.get(p.itemId) || 0) + (p._sum.quantity || 0));
  }
  for (const i of issues) {
    map.set(i.itemId, (map.get(i.itemId) || 0) - (i._sum.quantity || 0));
  }
  return map;
}

export async function computeStockForItem(itemId) {
  const [inSum, outSum] = await Promise.all([
    prisma.purchase.aggregate({ where: { itemId }, _sum: { quantity: true } }),
    prisma.issue.aggregate({ where: { itemId }, _sum: { quantity: true } }),
  ]);
  return (inSum._sum.quantity || 0) - (outSum._sum.quantity || 0);
}
