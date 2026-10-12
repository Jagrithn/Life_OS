import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseClient() {
  // Use import.meta.env for client-side (Vite build-time replacement)
  // Fall back to process.env for SSR (server-side rendering)
  // Public (publishable) values for this project. Safe to ship in the browser;
  // used when the hosting provider (e.g. Cloudflare) has no/mismatched env vars.
  const DEFAULT_URL = "https://mxpxhfhmiyyidqkwxvaz.supabase.co";
  const DEFAULT_KEY = "sb_publishable__4nfRe6_PBzGsEYoI9sKqQ_fL3E9orK";
  const processEnv = typeof process !== "undefined" ? process.env : undefined;
  const envUrl = import.meta.env["VITE_SUPABASE_URL"] || processEnv?.["SUPABASE_URL"];
  const envKey =
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || processEnv?.["SUPABASE_PUBLISHABLE_KEY"];
  // Only trust env values as a matched pair; a URL from one project with a key
  // from another is the classic "Invalid API key" error.
  const useEnv = !!envUrl && !!envKey && envUrl !== DEFAULT_URL;
  const SUPABASE_URL = useEnv ? envUrl : DEFAULT_URL;
  const SUPABASE_PUBLISHABLE_KEY = useEnv ? envKey : DEFAULT_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Add them to your .env file.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
