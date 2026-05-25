import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & import("next-auth").DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

/**
 * Edge-safe Auth.js 配置（不引入 Prisma / bcryptjs）。
 * middleware 与 Full 配置共用本对象；providers 在 auth.ts 里追加。
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "VISITOR";
        if (user.id) token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const role = typeof token.role === "string" ? token.role : "ADMIN";
        session.user.id = typeof token.sub === "string" ? token.sub : "";
        session.user.role = role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;