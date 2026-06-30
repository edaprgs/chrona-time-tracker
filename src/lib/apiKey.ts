import { supabase } from "@/lib/supabase";

export async function getOrCreateApiKey(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: existing } = await supabase
    .from("api_keys")
    .select("key")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existing?.key) return existing.key;

  const newKey = `chrona_${crypto.randomUUID().replace(/-/g, "")}`;
  const { error } = await supabase.from("api_keys").insert({ user_id: userId, key: newKey });
  return error ? null : newKey;
}

export async function regenerateApiKey(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  await supabase.from("api_keys").delete().eq("user_id", userId);
  const newKey = `chrona_${crypto.randomUUID().replace(/-/g, "")}`;
  const { error } = await supabase.from("api_keys").insert({ user_id: userId, key: newKey });
  return error ? null : newKey;
}
