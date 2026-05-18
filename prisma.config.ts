/**
 * Prisma 7 工程配置
 * - 7.x 起 schema.prisma 内不再支持 datasource.url
 * - migrate / introspect 用本文件的 datasource.url
 * - 运行期 PrismaClient 通过 @prisma/adapter-pg 注入连接（src/lib/db.ts）
 */
import path from "node:path";
import "dotenv/config";
import type { PrismaConfig } from "prisma";

export default {
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
} satisfies PrismaConfig;

