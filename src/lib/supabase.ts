/**
 * Cliente Supabase tipado (singleton) do backup independente de Belamar.
 *
 * Usa apenas credenciais PÚBLICAS de cliente (URL + publishable/anon key).
 * Chaves `service_role` jamais devem aparecer aqui — RLS é a fronteira de segurança.
 *
 * Ordem de resolução:
 *   1. VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY
 *   2. VITE_SUPABASE_ANON_KEY (compatibilidade com a etapa anterior)
 *   3. Fallback explícito abaixo, para o preview funcionar sem .env local.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** Credenciais públicas do cliente (seguras para o bundle do navegador). */
const FALLBACK_URL = "https://yxhawlqbxyoodindvnbs.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "sb_publishable_oRUNBiOq3XC6zMljp3B2MQ_qxyeff1_";

const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL = env["VITE_SUPABASE_URL"] || FALLBACK_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  env["VITE_SUPABASE_PUBLISHABLE_KEY"] || env["VITE_SUPABASE_ANON_KEY"] || FALLBACK_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export type BelamarClient = SupabaseClient<Database>;

const globalStore = globalThis as typeof globalThis & {
  __belamarSupabase?: BelamarClient;
};

function create(): BelamarClient {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
      storageKey: "belamar.auth",
    },
  });
}

/** Instância única, preservada entre recargas de HMR. */
export const supabase: BelamarClient = (globalStore.__belamarSupabase ??= create());

/** Compatibilidade com a API assíncrona da etapa anterior. */
export async function getSupabaseClient(): Promise<BelamarClient | null> {
  return supabase;
}
