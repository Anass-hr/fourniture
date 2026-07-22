import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { prisma } from "./lib/prisma.js";

/**
 * Réimporte une sauvegarde JSON (produite par `npm run export`) dans la base
 * pointée par DATABASE_URL — typiquement Supabase (PostgreSQL) lors de la
 * migration vers le cloud. Les identifiants et les relations sont préservés.
 *
 * Usage : npm run import [chemin/backup.json]
 * Sans argument, prend la sauvegarde la plus récente du dossier backend/.
 */
function latestBackup() {
  const files = readdirSync(".")
    .filter((f) => f.startsWith("backup-") && f.endsWith(".json"))
    .sort();
  if (files.length === 0) throw new Error("Aucun fichier backup-*.json trouvé. Lancez d'abord `npm run export`.");
  return files[files.length - 1];
}

async function main() {
  const file = process.argv[2] || latestBackup();
  const data = JSON.parse(readFileSync(file, "utf-8"));
  console.log(`📥 Import depuis : ${file}`);

  const existing = await prisma.user.count();
  if (existing > 0) {
    throw new Error(
      "La base cible n'est pas vide (" + existing + " utilisateur(s)). " +
      "Import annulé pour éviter d'écraser des données. Videz la base cible d'abord."
    );
  }

  // Ordre important : d'abord les entités référencées, puis les mouvements.
  await prisma.user.createMany({ data: data.users });
  await prisma.person.createMany({ data: data.people });
  await prisma.item.createMany({ data: data.items });
  await prisma.purchase.createMany({ data: data.purchases });
  await prisma.issue.createMany({ data: data.issues });

  // PostgreSQL : réaligner les séquences d'auto-incrément sur le max(id) importé,
  // sinon les prochaines insertions entrent en collision. (Sans effet sur SQLite.)
  const isPg = (process.env.DATABASE_URL || "").startsWith("postgres");
  if (isPg) {
    for (const t of ["User", "Person", "Item", "Purchase", "Issue"]) {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${t}"', 'id'), COALESCE((SELECT MAX(id) FROM "${t}"), 1))`
      );
    }
    console.log("🔧 Séquences PostgreSQL réalignées.");
  }

  console.log("✅ Import terminé :");
  console.log(`   Utilisateurs : ${data.users.length}`);
  console.log(`   Articles     : ${data.items.length}`);
  console.log(`   Personnes    : ${data.people.length}`);
  console.log(`   Achats       : ${data.purchases.length}`);
  console.log(`   Sorties      : ${data.issues.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("❌", e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
