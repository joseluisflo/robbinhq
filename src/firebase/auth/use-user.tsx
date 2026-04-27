'use client';

import { useMemo } from 'react';
import { useSession } from '@/lib/auth-client';

export type AppUser = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
};

export function useUser() {
  const { data, isPending, error } = useSession();

  const user = useMemo<AppUser | null>(() => {
    if (!data?.user) {
      return null;
    }

    return {
      id: data.user.id,
      uid: data.user.id,
      email: data.user.email ?? null,
      displayName: data.user.name ?? null,
      photoURL: data.user.image ?? null,
      emailVerified: Boolean(data.user.emailVerified),
    };
  }, [data]);

  return {
    user,
    loading: isPending,
    error,
    session: data?.session ?? null,
  };
}
