import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { recordSignInFailure } from "@/lib/rate-limit"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          const ip = extractIpFromReq(req)
          await recordSignInFailure(ip)
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordMatch) {
          const ip = extractIpFromReq(req)
          await recordSignInFailure(ip)
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id ?? token.sub
      }
      return session
    },
  },
}

function extractIpFromReq(
  req: { headers?: Record<string, string | string[] | undefined> } | undefined,
): string {
  if (!req?.headers) return 'unknown'
  const forwarded = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded
  const realIpStr = Array.isArray(realIp) ? realIp[0] : realIp
  return forwardedStr?.split(',')[0].trim() || realIpStr || 'unknown'
}
