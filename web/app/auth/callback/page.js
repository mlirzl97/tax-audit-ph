"use client";

import { useEffect, useState } from "react";

import { createClient } from "../../../lib/supabase/client";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Verifying your sign-in…");

  useEffect(() => {
    async function finishSignIn() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const hash = new URLSearchParams(url.hash.slice(1));
      let error;

      if (code) {
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        ({ error } = await supabase.auth.setSession({
          access_token: hash.get("access_token"),
          refresh_token: hash.get("refresh_token"),
        }));
      } else {
        error = new Error("Missing confirmation credentials");
      }

      if (error) {
        setMessage("This sign-in link could not be verified.");
        window.location.replace("/login?error=callback_failed");
        return;
      }
      window.location.replace("/cases");
    }

    finishSignIn();
  }, []);

  return (
    <main className="auth-shell">
      <section className="auth-card callback-card" aria-live="polite">
        <p className="eyebrow">Secure sign-in</p>
        <h1>{message}</h1>
      </section>
    </main>
  );
}
