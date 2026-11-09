import Link from "next/link";
import { notFound } from "next/navigation";

import {
  caseStages,
  checklistStatuses,
  getProfessionalReviewReasons,
  isUuid,
  noticeTypes,
} from "../../../lib/case-validation.mjs";
import { requireUser } from "../../../lib/auth";
import { getNoticeGuidance } from "../../notice-guidance.mjs";
import { updateCase, updateChecklist } from "../actions";
import CaseControls from "../case-controls";
import CaseForm from "../case-form";
import DeadlinePanel from "../deadline-panel";
import WorkspaceHeader from "../workspace-header";

const stageLabels = Object.fromEntries(caseStages);
const noticeLabels = Object.fromEntries(noticeTypes);
const answerLabels = { yes: "Yes", no: "No", not_sure: "Not sure" };
const deliveryLabels = {
  hand_delivery: "Hand delivery",
  mail_courier: "Mail or courier",
  email: "Email",
  bir_portal: "BIR portal or electronic system",
  not_sure: "Not sure",
};

export default async function CasePage({ params, searchParams }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const query = await searchParams;
  const { email, supabase } = await requireUser();
  const [caseResult, checklistResult, eventResult, controlAuditResult, deadlineResult] = await Promise.all([
    supabase.from("audit_cases").select("*").eq("id", id).single(),
    supabase.from("case_checklist").select("id, label, status, position").eq("case_id", id).order("position"),
    supabase.from("case_events").select("id, event_type, details, created_at").eq("case_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("control_audit_log").select("id, event_type, details, created_at").eq("case_id", id).order("created_at", { ascending: false }).limit(30),
    supabase.from("case_deadlines").select("id, deadline_type, deadline_date, source_event, status, version").eq("case_id", id).order("version", { ascending: false }),
  ]);

  if (caseResult.error || !caseResult.data) notFound();
  const caseRecord = caseResult.data;
  const checklist = checklistResult.data ?? [];
  const guidance = getNoticeGuidance(caseRecord.notice_type);
  const reviewReasons = getProfessionalReviewReasons(caseRecord, checklist);
  const availableRecords = checklist.filter((item) => item.status === "available").length;
  const updateAction = updateCase.bind(null, id);
  const deadlines = deadlineResult.data ?? [];
  const statutoryDeadline = deadlines.find((deadline) => deadline.deadline_type === "statutory" && deadline.status !== "superseded");
  const unsignedCrfDay = Math.max(
    1,
    Math.floor((Date.now() - new Date(caseRecord.created_at).getTime()) / 86_400_000) + 1,
  );
  const auditEvents = [...(eventResult.data ?? []), ...(controlAuditResult.data ?? [])]
    .sort((left, right) => new Date(right.created_at) - new Date(left.created_at))
    .slice(0, 30);

  return (
    <main className="workspace-shell">
      <WorkspaceHeader email={email} />
      <div className="workspace-content">
        <Link className="back-link" href="/cases">← All cases</Link>
        <section className="case-heading">
          <div>
            <p className="eyebrow">{noticeLabels[caseRecord.notice_type]}</p>
            <h1>{caseRecord.client_reference}</h1>
            <div className="case-meta">
              <span className={`status-pill status-${caseRecord.stage}`}>{stageLabels[caseRecord.stage]}</span>
              <span>Received {caseRecord.received_date}</span>
              <span>{statutoryDeadline ? `${statutoryDeadline.deadline_date} · ${statutoryDeadline.status}` : "Deadline not recorded"}</span>
            </div>
          </div>
          <a className="secondary-link" href={`/cases/${id}/export`}>Download handoff file</a>
        </section>
        {query?.error && <p className="form-alert" role="alert">{query.error}</p>}
        {query?.saved && <p className="form-success" role="status">Case changes saved.</p>}
        {caseRecord.crf_status !== "signed" && (
          <p className="form-alert" role="alert">
            Unsigned CRF · day {unsignedCrfDay}. Only protective actions are permitted unless the Tax Supervisor or HOD records a written override.
          </p>
        )}

        <ol className="readiness-rail" aria-label="Case readiness">
          <li className="readiness-done"><span>1</span><strong>Facts</strong><small>Recorded</small></li>
          <li><span>2</span><strong>Records</strong><small>{availableRecords} of {checklist.length} available</small></li>
          <li><span>3</span><strong>Reconcile</strong><small>Not started</small></li>
          <li><span>4</span><strong>Review</strong><small>{reviewReasons.length ? "Recommended" : "Optional"}</small></li>
          <li><span>5</span><strong>Respond</strong><small>Not started</small></li>
        </ol>

        <div className="case-layout">
          <div className="case-primary">
            <section className="guidance-card next-step-card">
              <p className="eyebrow">Next controlled action</p>
              <h2>{noticeLabels[caseRecord.notice_type]}</h2>
              <p>{guidance?.action ?? "Ask a Philippine tax professional to identify the notice and next safe action."}</p>
              <div className="warning">Keep the original letter and proof of receipt. Have any legal deadline confirmed before relying on it.</div>
            </section>

            <CaseControls caseRecord={caseRecord} />
            <DeadlinePanel caseId={id} deadlines={deadlines} />

            <section className="workspace-card">
              <div className="card-title-row">
                <div><p className="eyebrow">Work through this list</p><h2>Records to gather</h2></div>
              </div>
              <div className="checklist-list">
                {checklist.map((item) => (
                  <form key={item.id} className="checklist-item" action={updateChecklist.bind(null, id, item.id)}>
                    <label htmlFor={`status-${item.id}`}>{item.label}</label>
                    <div>
                      <select id={`status-${item.id}`} name="status" defaultValue={item.status}>
                        {checklistStatuses.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                      <button type="submit" className="secondary-button">Update</button>
                    </div>
                  </form>
                ))}
              </div>
            </section>

            <details className="workspace-card case-details">
              <summary>Edit the case details</summary>
              <CaseForm action={updateAction} caseRecord={caseRecord} submitLabel="Save case changes" />
            </details>
          </div>

          <aside className="case-sidebar">
            <section className="workspace-card triage-summary">
              <p className="eyebrow">Intake facts</p>
              <h2>Recorded service facts</h2>
              <dl>
                <div><dt>BIR officer present</dt><dd>{answerLabels[caseRecord.bir_officer_present] ?? "Not sure"}</dd></div>
                <div><dt>Enforcement wording</dt><dd>{answerLabels[caseRecord.enforcement_terms_mentioned] ?? "Not sure"}</dd></div>
                <div><dt>Response period stated</dt><dd>{answerLabels[caseRecord.response_period_mentioned] ?? "Not sure"}</dd></div>
                <div><dt>How it arrived</dt><dd>{deliveryLabels[caseRecord.delivery_method] ?? "Not sure"}</dd></div>
              </dl>
              <small>Recorded facts only. The system makes no conclusion on validity of service.</small>
            </section>
            <section className={`guidance-card review-card ${reviewReasons.length ? "review-recommended" : "review-optional"}`}>
              <p className="eyebrow">Escalation review</p>
              <h2>{reviewReasons.length ? "Professional review recommended" : "Standard review path"}</h2>
              {reviewReasons.length ? (
                <ul className="review-reasons">
                  {reviewReasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              ) : (
                <p>No automatic escalation trigger is recorded. Continue through the assigned review path.</p>
              )}
              <a className="secondary-link handoff-link" href={`/cases/${id}/export`}>
                Export case record
              </a>
              <small>The file contains your verified facts, checklist, and activity history. It does not submit anything to BIR.</small>
            </section>
            <section className="workspace-card timeline-card">
              <p className="eyebrow">Audit trail</p>
              <h2>Recent activity</h2>
              <ol className="timeline">
                {auditEvents.map((event) => (
                  <li key={event.id}>
                    <strong>{event.event_type.replaceAll("_", " ")}</strong>
                    <span>{new Date(event.created_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</span>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
