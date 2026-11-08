import { redirect } from "next/navigation";

import { createClient } from "./supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) redirect("/login");

  return {
    email: data.claims.email ?? "Signed-in user",
    supabase,
    userId: data.claims.sub,
  };
}
