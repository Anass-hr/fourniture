import "dotenv/config";
import { writeFileSync } from "node:fs";
import { prisma } from "./lib/prisma.js";

/**
 * Exporte toute la base (utilisateurs, articles, personnes, achats, sorties)
 * dans un fichier JSON horodaté. Sert de sauvegarde et de source pour la
 * migration vers Supabase (PostgreSQL).
 * Usage : npm run export
 */
async function main() {
  const [users, people, items, purchases, issues] = await Promise.all([
    prisma.user.findMany({ orderBy: { id: "asc" } }),
    prisma.person.findMany({ orderBy: { id: "asc" } }),
    prisma.item.findMany({ orderBy: { id: "asc" } }),
    prisma.purchase.findMany({ orderBy: { id: "asc" } }),
    prisma.issue.findMany({ orderBy: { id: "asc" } }),
  ]);

  const dump = { exportedAt: new Date().toISOString(), users, people, items, purchases, issues };
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const file = `backup-${stamp}.json`;
  writeFileSync(file, JSON.stringify(dump, null, 2), "utf-8");

  console.log(`💾 Sauvegarde écrite : backend/${file}`);
  console.log(`   Utilisateurs : ${users.length}`);
  console.log(`   Articles     : ${items.length}`);
  console.log(`   Personnes    : ${people.length}`);
  console.log(`   Achats       : ${purchases.length}`);
  console.log(`   Sorties      : ${issues.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
