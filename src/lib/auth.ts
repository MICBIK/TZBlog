import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { db } from "./db";
import { authConfig } from "./auth.config";
import {
  MAGIC_LINK_MAX_AGE_SECONDS,
  sendVerificationRequest,
} from "./email/sendMagicLink";
import { ensureVisitorRoleOnCreate } from "./auth/visitorRole";
import { loginSchema } from "./schemas/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          role: user.role,
        };
      },
    }),
    EmailProvider({
      server: {
        host: "127.0.0.1",
        port: 1025,
        auth: { user: "unused", pass: "unused" },
      },
      from: process.env.AUTH_EMAIL_FROM ?? "TZBlog <onboarding@resend.dev>",
      maxAge: MAGIC_LINK_MAX_AGE_SECONDS,
      sendVerificationRequest,
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        await ensureVisitorRoleOnCreate(user.id, user.email, user.name);
      }
    },
  },
});
