"use client";

/**
 * Auth in zwei Modi:
 * - Supabase-Modus (Phase 2): echte Konten mit E-Mail + Passwort, sobald
 *   supabaseConfigured() true ist (Env-Variablen gesetzt).
 * - localStorage-Fallback (Phase 1): unveraendertes Demo-Verhalten, solange
 *   Supabase (noch) nicht konfiguriert ist - z. B. Produktion vor Env-Setup.
 */

import type { User } from "@supabase/supabase-js";
import type { LocalizedString } from "@/data/types";
import type { Plan } from "./plan";
import { getSupabaseBrowser, supabaseConfigured } from "./supabase/client";
import { ensureLocalDataMigrated } from "./migrate";

/* =========================================================================
 * Phase-1-Demo-Auth (localStorage) - bleibt als Fallback vollstaendig erhalten
 * ========================================================================= */

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

/* =========================================================================
 * Einheitliche Auth-API (Phase 2) - nutzt Supabase, faellt sonst auf die
 * Phase-1-Funktionen oben zurueck. Neue UI-Komponenten nutzen NUR diese API.
 * ========================================================================= */

export interface AuthUser {
  /** Supabase-User-ID oder "local" im Demo-Modus */
  id: string;
  email: string;
  username: string;
  createdAt?: string;
  bricklinkStore?: string;
  /** "supabase" = echtes Konto, "local" = Phase-1-Demo im Browser */
  source: "supabase" | "local";
}

export type AuthResult =
  | { ok: true; needsConfirmation: boolean }
  | { ok: false; message: LocalizedString };

const MSG: Record<string, LocalizedString> = {
  invalidCredentials: {
    de: "E-Mail oder Passwort ist falsch.",
    en: "Email or password is incorrect.",
  },
  emailNotConfirmed: {
    de: "Bitte bestätige zuerst deine E-Mail-Adresse - wir haben dir einen Link geschickt.",
    en: "Please confirm your email address first - we sent you a link.",
  },
  alreadyRegistered: {
    de: "Diese E-Mail ist bereits registriert - bitte melde dich an.",
    en: "This email is already registered - please log in.",
  },
  weakPassword: {
    de: "Das Passwort ist zu schwach - bitte mindestens 6 Zeichen verwenden.",
    en: "The password is too weak - please use at least 6 characters.",
  },
  invalidEmail: {
    de: "Diese E-Mail-Adresse sieht nicht gültig aus.",
    en: "This email address does not look valid.",
  },
  rateLimit: {
    de: "Zu viele Versuche - bitte warte einen Moment und versuche es erneut.",
    en: "Too many attempts - please wait a moment and try again.",
  },
  generic: {
    de: "Das hat leider nicht geklappt - bitte versuche es erneut.",
    en: "That did not work - please try again.",
  },
  noLocalAccount: {
    de: "Kein Konto gefunden - bitte zuerst registrieren.",
    en: "No account found - please sign up first.",
  },
};

const BRICKLINK_KEY_PREFIX = "bricktopia.bricklink.";

function mapSupabaseUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    typeof meta.display_name === "string" ? meta.display_name.trim() : "";
  const username =
    displayName || (u.email ? u.email.split("@")[0] : "Sammler");
  let bricklinkStore: string | undefined;
  if (typeof window !== "undefined") {
    bricklinkStore =
      window.localStorage.getItem(BRICKLINK_KEY_PREFIX + u.id) ?? undefined;
  }
  return {
    id: u.id,
    email: u.email ?? "",
    username,
    createdAt: u.created_at,
    bricklinkStore,
    source: "supabase",
  };
}

function mapLocalUser(u: DemoUser): AuthUser {
  return {
    id: "local",
    email: u.email,
    username: u.username,
    createdAt: u.createdAt,
    bricklinkStore: u.bricklinkStore,
    source: "local",
  };
}

function mapAuthError(error: {
  code?: string;
  message?: string;
  status?: number;
}): LocalizedString {
  const code = error.code ?? "";
  const msg = error.message ?? "";
  if (code === "invalid_credentials" || /invalid login credentials/i.test(msg))
    return MSG.invalidCredentials;
  if (code === "email_not_confirmed") return MSG.emailNotConfirmed;
  if (
    code === "user_already_exists" ||
    code === "email_exists" ||
    /already registered/i.test(msg)
  )
    return MSG.alreadyRegistered;
  if (code === "weak_password" || /password.*(short|weak|least)/i.test(msg))
    return MSG.weakPassword;
  if (
    code === "email_address_invalid" ||
    code === "validation_failed" ||
    /invalid.*email|email.*invalid/i.test(msg)
  )
    return MSG.invalidEmail;
  if (error.status === 429 || /rate limit/i.test(msg)) return MSG.rateLimit;
  return MSG.generic;
}

/** Bestandsdaten aus Phase 1 importieren - darf Login nie blockieren. */
async function runMigration(userId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  try {
    await ensureLocalDataMigrated(supabase, userId);
  } catch {
    // Import wird beim naechsten Laden erneut versucht (Marker nicht gesetzt).
  }
}

/** Aktueller Nutzer - Supabase-Session oder Demo-Konto, sonst null. */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (supabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    const u = data.session?.user;
    return u ? mapSupabaseUser(u) : null;
  }
  const local = isLoggedIn() ? getUser() : null;
  return local ? mapLocalUser(local) : null;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAuthUser()) !== null;
}

/**
 * Meldet den aktuellen Zustand sofort und bei jeder Aenderung (Login, Logout,
 * Token-Refresh). Rueckgabe: Unsubscribe-Funktion (fuer useEffect-Cleanup).
 */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (supabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      cb(null);
      return () => {};
    }
    void supabase.auth.getSession().then(({ data }) => {
      cb(data.session?.user ? mapSupabaseUser(data.session.user) : null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      cb(session?.user ? mapSupabaseUser(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }
  const local = typeof window !== "undefined" && isLoggedIn() ? getUser() : null;
  cb(local ? mapLocalUser(local) : null);
  return () => {};
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
): Promise<AuthResult> {
  if (!supabaseConfigured()) {
    register({ username, email, createdAt: new Date().toISOString() });
    return { ok: true, needsConfirmation: false };
  }
  const supabase = getSupabaseBrowser();
  if (!supabase) return { ok: false, message: MSG.generic };
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: username },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) return { ok: false, message: mapAuthError(error) };
  if (data.session && data.user) {
    // Bestaetigung deaktiviert: direkt eingeloggt.
    await runMigration(data.user.id);
    return { ok: true, needsConfirmation: false };
  }
  // Bereits registrierte E-Mail liefert bei aktivierter Bestaetigung einen
  // Platzhalter-User ohne Identities - als Fehler ausweisen statt Mail-Hinweis.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ok: false, message: MSG.alreadyRegistered };
  }
  return { ok: true, needsConfirmation: true };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  if (!supabaseConfigured()) {
    return login()
      ? { ok: true, needsConfirmation: false }
      : { ok: false, message: MSG.noLocalAccount };
  }
  const supabase = getSupabaseBrowser();
  if (!supabase) return { ok: false, message: MSG.generic };
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) return { ok: false, message: mapAuthError(error) };
  if (data.user) await runMigration(data.user.id);
  return { ok: true, needsConfirmation: false };
}

export async function signOutUser(): Promise<void> {
  if (supabaseConfigured()) {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    return;
  }
  logout();
}

/** BrickLink-Store-Name speichern (lokal, DB-Spalte folgt spaeter). */
export function setBricklinkStore(user: AuthUser, store: string): AuthUser {
  const value = store.trim();
  if (user.source === "local") {
    const next = updateUser({ bricklinkStore: value || undefined });
    return next ? mapLocalUser(next) : { ...user, bricklinkStore: value || undefined };
  }
  const key = BRICKLINK_KEY_PREFIX + user.id;
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
  return { ...user, bricklinkStore: value || undefined };
}

/* ---------- Profil (public.profiles) ---------- */

export interface Profile {
  plan: Plan;
  planBilling: "monthly" | "yearly" | "once" | null;
  founderNumber: number | null;
  referralCode: string | null;
}

/** Profil-Zeile des eingeloggten Supabase-Nutzers (Plan, Referral-Code). */
export async function getProfile(): Promise<Profile | null> {
  if (!supabaseConfigured()) return null;
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const { data: sess } = await supabase.auth.getSession();
  const uid = sess.session?.user.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("plan, plan_billing, founder_number, referral_code")
    .eq("id", uid)
    .maybeSingle();
  if (error || !data) return null;
  const plan: Plan = (["free", "sammler", "investor", "founder"] as const).includes(
    data.plan as Plan
  )
    ? (data.plan as Plan)
    : "free";
  return {
    plan,
    planBilling: data.plan_billing ?? null,
    founderNumber: data.founder_number ?? null,
    referralCode: data.referral_code ?? null,
  };
}
