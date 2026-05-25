import "dotenv/config";

import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD is required for admin e2e setup. Configure it in .env.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      password: passwordHash,
    },
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      password: passwordHash,
    },
  });
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
