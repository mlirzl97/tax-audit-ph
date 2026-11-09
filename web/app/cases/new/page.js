import Link from "next/link";

import { requireUser } from "../../../lib/auth";
import { createCase } from "../actions";
import FirstResponseForm from "../first-response-form";
import WorkspaceHeader from "../workspace-header";

export default async function NewCasePage() {
  const { email } = await requireUser();

  return (
    <main className="workspace-shell">
      <WorkspaceHeader email={email} />
      <div className="workspace-content narrow-workspace">
        <Link className="back-link" href="/cases">← All cases</Link>
        <section className="workspace-title-row compact-title">
          <div>
            <p className="eyebrow">Notice intake</p>
            <h1>Log the first service facts.</h1>
            <p>Create the case now. Validation, engagement controls, and deadline confirmation follow inside the workspace.</p>
          </div>
        </section>
        <section className="intake-sheet">
          <FirstResponseForm action={createCase} />
        </section>
      </div>
    </main>
  );
}
