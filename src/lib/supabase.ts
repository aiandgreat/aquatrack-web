import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client (lazy singleton).
 * Only instantiated on the client — avoids SSR crashes when NEXT_PUBLIC_*
 * env vars are undefined at Next.js static-generation / prerender time.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Add them to your .env.local file."
      );
    }

    _client = createClient(url, key);
  }
  return _client;
}

/** Convenience re-export for components that prefer `supabase.auth.*` call style. */
export const supabase = {
  get auth() {
    return getSupabaseClient().auth;
  },
  get storage() {
    return getSupabaseClient().storage;
  }
};

/**
 * Uploads a file (photo of discolored water or pipe breach) to the
 * 'complaint-media' Supabase Storage bucket and returns its public URL.
 */
export async function uploadComplaintPhoto(file: File): Promise<string> {
  const client = getSupabaseClient();
  const fileExt = file.name.split(".").pop();
  const filePath = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await client.storage
    .from("complaint-media")
    .upload(filePath, file);

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  const { data } = client.storage.from("complaint-media").getPublicUrl(filePath);
  return data.publicUrl;
}

