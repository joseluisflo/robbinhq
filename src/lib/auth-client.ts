"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  updateUser,
} = authClient;
