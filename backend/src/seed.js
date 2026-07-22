import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";

async function main() {
  // --- Compte administrateur ---
  const email = (process.env.ADMIN_EMAIL || "admin@officestock.local").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Administrateur";

  const existingAdmin = await prisma.user.findUnique({ where: { email } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, name, passwordHash, role: "ADMIN" } });
    console.log(`👤 Compte admin créé : ${email} / ${password}`);
  } else {
    console.log(`👤 Compte admin déjà présent : ${email}`);
  }

  // Aucune donnée de démonstration : l'inventaire démarre vide.
  // Les articles et les personnes sont saisis directement dans l'application.
  const itemCount = await prisma.item.count();
  const personCount = await prisma.person.count();
  console.log(`📦 Inventaire : ${itemCount} article(s), ${personCount} personne(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
