import type { NextAuthConfig } from "next-auth";

// Split out so middleware (edge runtime) can use it without pulling in
// bcrypt/Prisma, which don't run on the edge.
export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "aperture-auth-secret-key-2026",
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    // Route gating itself happens in middleware.ts (it needs role-aware
    // logic for /admin, not just an authenticated/not check).
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id as string;
        token.avatarUrl = user.avatarUrl;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("@/generated/prisma/client").Role;
        session.user.avatarUrl = token.avatarUrl as string | null | undefined;
      }
      return session;
    },
  },
  providers: [], // populated in auth.ts (needs Node runtime for bcrypt/Prisma)
};
