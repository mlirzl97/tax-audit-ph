import Link from "next/link";

import { requireUser } from "../../../lib/auth";
import { createCase } from "../actions";
import FirstResponseForm from "../first-response-form";
import WorkspaceHeader from "../workspace-header";

export default async function NewCasePage({ searchParams }) {
  const params = await searchParams;
  const { email } = await requireUser();

  return (
    <main className="workspace-shell">
      <WorkspaceHeader email={email} />
      <div className="workspace-content narrow-workspace">
        <Link className="back-link" href="/cases">← All cases</Link>
        <section className="workspace-title-row compact-title">
          <div>
            <p className="eyebrow">First Response</p>
            <h1>You do not have to solve everything right now.</h1>
            <p>We’ll ask one question at a time and save only what you tell us.</p>
          </div>
        </section>
        {params?.error && <p className="form-alert" role="alert">{params.error}</p>}
        <section className="workspace-card">
          <FirstResponseForm action={createCase} />
        </section>
      </div>
    </main>
  );
}
