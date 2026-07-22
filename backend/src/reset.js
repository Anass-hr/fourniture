import "dotenv/config";
import { prisma } from "./lib/prisma.js";

/**
 * Vide complètement l'inventaire : articles, personnes, achats et sorties.
 * Les comptes utilisateurs (admin / personnel) sont CONSERVÉS.
 * Usage : npm run reset
 */
async function main() {
  // L'ordre compte : on supprime d'abord les mouvements qui référencent
  // les articles et les personnes.
  const issues = await prisma.issue.deleteMany({});
  const purchases = await prisma.purchase.deleteMany({});
  const items = await prisma.item.deleteMany({});
  const people = await prisma.person.deleteMany({});

  console.log("🧹 Inventaire remis à zéro :");
  console.log(`   - ${issues.count} sortie(s) supprimée(s)`);
  console.log(`   - ${purchases.count} achat(s) supprimé(s)`);
  console.log(`   - ${items.count} article(s) supprimé(s)`);
  console.log(`   - ${people.count} personne(s) supprimée(s)`);

  const users = await prisma.user.count();
  console.log(`👤 ${users} compte(s) utilisateur conservé(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
