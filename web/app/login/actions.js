"use server";

import { redirect } from "next/navigation";

import { createClient } from "../../lib/supabase/server";

function credentials(formData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

function validCredentials({ email, password }) {
  return /^\S+@\S+\.\S+$/.test(email) && password.length >= 12;
}

export async function signIn(formData) {
  const input = credentials(formData);
  if (!validCredentials(input)) redirect("/login?error=invalid_input");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(input);
  if (error) redirect("/login?error=invalid_login");

  redirect("/cases");
}

export async function signUp(formData) {
  const input = credentials(formData);
  if (!validCredentials(input)) redirect("/login?error=invalid_input");

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    ...input,
    options: { emailRedirectTo: `${siteUrl}/auth/callback` },
  });

  if (error) redirect("/login?error=signup_failed");
  if (!data.session) redirect("/login?message=check_email");
  redirect("/cases");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
