import Link from "next/link";

import { caseStages, noticeTypes } from "../../lib/case-validation.mjs";
import { requireUser } from "../../lib/auth";
import WorkspaceHeader from "./workspace-header";

const stageLabels = Object.fromEntries(caseStages);
const noticeLabels = Object.fromEntries(noticeTypes);

export default async function CasesPage({ searchParams }) {
  const params = await searchParams;
  const { email, supabase } = await requireUser();
  const [{ data: membership }, { data: cases, error }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role, organizations(name)")
      .limit(1)
      .single(),
    supabase
      .from("audit_cases")
      .select("id, client_reference, notice_type, received_date, stage, updated_at")
      .order("updated_at", { ascending: false }),
  ]);

  return (
    <main className="workspace-shell">
      <WorkspaceHeader email={email} />
      <div className="workspace-content">
        <section className="workspace-title-row">
          <div>
            <p className="eyebrow">{membership?.organizations?.name ?? "Case workspace"}</p>
            <h1>Audit cases</h1>
            <p>Track verified facts, records, and professional review status.</p>
          </div>
          <Link className="primary-link" href="/cases/new">Create case <span aria-hidden="true">→</span></Link>
        </section>
        {params?.error && <p className="form-alert" role="alert">{params.error}</p>}
        {error ? (
          <p className="form-alert" role="alert">Cases could not be loaded.</p>
        ) : cases?.length ? (
          <div className="case-table-wrap">
            <table className="case-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Notice</th>
                  <th>Received</th>
                  <th>Stage</th>
                  <th><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.client_reference}</strong></td>
                    <td>{noticeLabels[item.notice_type]}</td>
                    <td>{item.received_date}</td>
                    <td><span className={`status-pill status-${item.stage}`}>{stageLabels[item.stage]}</span></td>
                    <td><Link href={`/cases/${item.id}`}>Open case</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="empty-workspace">
            <span className="panel-icon" aria-hidden="true">01</span>
            <h2>Create your first audit case.</h2>
            <p>Start with a client reference, notice type, and actual receipt date.</p>
            <Link className="primary-link" href="/cases/new">Create case</Link>
          </section>
        )}
      </div>
    </main>
  );
}
