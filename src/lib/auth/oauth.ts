import { supabase } from '@/lib/supabaseClient';

export const AUTH_CALLBACK_PATH = '/auth/callback';

/** Full URL Supabase redirects to after OAuth (must match Dashboard → Auth → URL config). */
export function getOAuthRedirectUrl(): string {
  const base = (import.meta.env.VITE_APP_URL as string | undefined)?.trim() || window.location.origin;
  return `${base.replace(/\/$/, '')}${AUTH_CALLBACK_PATH}`;
}

const REDIRECT_STORAGE_KEY = 'jukebox_oauth_next';

export function rememberPostAuthRedirect(path: string) {
  if (!path || path === AUTH_CALLBACK_PATH) return;
  localStorage.setItem(REDIRECT_STORAGE_KEY, path);
}
export function takePostAuthRedirect(): string {
  const next = localStorage.getItem(REDIRECT_STORAGE_KEY);
  localStorage.removeItem(REDIRECT_STORAGE_KEY);
  return (next && next.startsWith('/') && !next.startsWith('//')) ? next : '/';
}

export async function signInWithGoogleOAuth() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getOAuthRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
}
