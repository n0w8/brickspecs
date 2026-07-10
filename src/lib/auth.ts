"use client";

/**
 * Phase-1-Demo-Auth: Konten liegen ausschließlich im localStorage des Browsers.
 * In Phase 2 wird dies durch echte Auth (z. B. Supabase/NextAuth) ersetzt.
 */

export interface DemoUser {
  username: string;
  email: string;
  createdAt: string;
  bricklinkStore?: string;
}

const USER_KEY = "bricktopia.user";
const SESSION_KEY = "bricktopia.session";

export function getUser(): DemoUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoUser;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SESSION_KEY) === "1" && getUser() !== null;
}

export function register(user: DemoUser): void {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(SESSION_KEY, "1");
}

export function login(): boolean {
  if (getUser() === null) return false;
  window.localStorage.setItem(SESSION_KEY, "1");
  return true;
}

export function logout(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export function updateUser(patch: Partial<DemoUser>): DemoUser | null {
  const user = getUser();
  if (!user) return null;
  const next = { ...user, ...patch };
  window.localStorage.setItem(USER_KEY, JSON.stringify(next));
  return next;
}
