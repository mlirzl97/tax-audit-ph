import Link from "next/link";

import { signIn, signUp } from "./actions";

const messages = {
  invalid_input: "Enter a valid email and a password with at least 12 characters.",
  invalid_login: "The email or password was not accepted.",
  signup_failed: "We could not create the account. Try signing in if it already exists.",
  callback_failed: "The sign-in link could not be verified. Request a new one.",
};

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const error = messages[params?.error];
  const checkEmail = params?.message === "check_email";

  return (
    <main className="auth-shell">
      <Link className="brand auth-brand" href="/">
        <span className="brand-mark" aria-hidden="true">TA</span>
        <span>Tax Audit PH</span>
      </Link>
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="eyebrow">Private alpha</p>
        <h1 id="auth-title">Open your case workspace.</h1>
        <p className="auth-intro">
          Sign in to create and manage audit cases. Do not upload tax notices yet;
          secure document handling is not enabled in this release.
        </p>
        {error && <p className="form-alert" role="alert">{error}</p>}
        {checkEmail && (
          <p className="form-success" role="status">
            Check your email and follow the confirmation link to finish signing in.
          </p>
        )}
        <form className="auth-form">
          <div className="field">
            <label htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              minLength="12"
              autoComplete="current-password"
              required
            />
            <small>Use at least 12 characters.</small>
          </div>
          <button formAction={signIn}>Sign in</button>
          <button className="secondary-button" formAction={signUp}>Create account</button>
        </form>
      </section>
    </main>
  );
}
