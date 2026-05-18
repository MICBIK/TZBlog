/**
 * TZBlog 初始化 seed
 * - upsert 一个 ADMIN role 的 User（凭 ADMIN_EMAIL/ADMIN_PASSWORD 环境变量）
 * - upsert SiteConfig singleton（id = "singleton"）
 *
 * 运行：pnpm db:seed
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment to seed the admin user."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      // 不覆盖现有密码，避免 reset 误伤
      role: "ADMIN",
    },
    create: {
      email,
      name: "Admin",
      role: "ADMIN",
      password: passwordHash,
    },
  });

  await prisma.siteConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      themeName: "default",
      themeVars: {},
      metadata: {
        title: "TZBlog",
        description: "个人技术博客",
      },
    },
  });

  console.log(`✅ Seeded admin user: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
