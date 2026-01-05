"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) {
          router.replace('/login?error=session');
          return;
        }
        const data = await res.json();
        if (data?.user) {
          // Persist full user data for client UI
          localStorage.setItem('atlas_user', JSON.stringify({
            id: data.user.id,
            name: data.user.name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email,
            avatar: data.user.avatar || null
          }));
          // Optional: mark token presence for client checks
          localStorage.setItem('atlas_token', 'present');
          router.replace('/dashboard');
        } else {
          router.replace('/login?error=session');
        }
      } catch (e) {
        router.replace('/login?error=callback');
      }
    };
    finalize();
  }, [router]);

  return null;
}


