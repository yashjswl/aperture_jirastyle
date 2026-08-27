import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { encode as defaultEncode, decode as defaultDecode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";

const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const DEFAULT_MAX_AGE = 60 * 60 * 8; // 8 hours

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "aperture-auth-secret-key-2026",
  ...authConfig,
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_ME_MAX_AGE, // upper bound for the cookie itself; actual
    // validity is enforced per-login via the custom jwt encode/decode below.
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember me", type: "text" },
      },
      async authorize(credentials) {
        try {
          const email = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;
          if (!email || !password) return null;

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user || !user.isActive) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            rememberMe: credentials?.remember === "true",
          };
        } catch (err) {
          console.error("Authentication error in authorize():", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id as string;
        token.avatarUrl = user.avatarUrl;
        token.rememberMe = Boolean((user as { rememberMe?: boolean }).rememberMe);
      }
      return token;
    },
  },
  jwt: {
    encode: async ({ token, secret, salt }) => {
      const effectiveMaxAge = token?.rememberMe ? REMEMBER_ME_MAX_AGE : DEFAULT_MAX_AGE;
      return defaultEncode({ token, secret, salt, maxAge: effectiveMaxAge });
    },
    decode: async ({ token, secret, salt }) => defaultDecode({ token, secret, salt }),
  },
});
