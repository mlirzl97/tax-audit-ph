import { confirmDeadline, createPreliminaryDeadline } from "./control-actions";

type Deadline = {
  id: string;
  deadline_type: "statutory" | "extension_decision" | "submission_target";
  deadline_date: string;
  source_event: string;
  status: "preliminary" | "confirmed" | "superseded";
  version: number;
};

const deadlineLabels = {
  statutory: "Statutory deadline",
  extension_decision: "Extension decision date",
  submission_target: "Submission target",
};

export default function DeadlinePanel({ caseId, deadlines }: { caseId: string; deadlines: Deadline[] }) {
  const createDeadline = createPreliminaryDeadline.bind(null, caseId);
  const activeDeadlines = deadlines.filter((deadline) => deadline.status !== "superseded");

  return (
    <section className="workspace-card">
      <p className="eyebrow">Deadline control</p>
      <h2>Preliminary and confirmed dates</h2>
      <p>Requested extensions do not change the deadline. Create a new version only after the BIR acknowledgement is recorded.</p>

      {activeDeadlines.length ? (
        <div className="checklist-list">
          {activeDeadlines.map((deadline) => (
            <div className="checklist-item" key={deadline.id}>
              <div>
                <strong>{deadlineLabels[deadline.deadline_type]}</strong>
                <small>Version {deadline.version} · {deadline.source_event.replaceAll("_", " ")}</small>
              </div>
              <div>
                <span>{deadline.deadline_date} · {deadline.status}</span>
                {deadline.deadline_type === "statutory" && deadline.status === "preliminary" && (
                  <form action={confirmDeadline.bind(null, caseId, deadline.id)}>
                    <button type="submit" className="secondary-button">Confirm deadline</button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No deadline version has been recorded.</p>
      )}

      <form className="case-form" action={createDeadline}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="deadlineDate">Preliminary statutory deadline</label>
            <input id="deadlineDate" name="deadlineDate" type="date" required />
          </div>
          <div className="field">
            <label htmlFor="sourceEvent">What created this deadline?</label>
            <select id="sourceEvent" name="sourceEvent" defaultValue="notice_receipt">
              <option value="notice_receipt">Notice receipt</option>
              <option value="extension_acknowledgement">BIR extension acknowledgement</option>
              <option value="amended_or_reissued_notice">Amended or reissued notice</option>
              <option value="additional_bir_request">Additional BIR request</option>
              <option value="meeting_minutes">Meeting minutes</option>
              <option value="corrected_receipt_date">Corrected receipt date</option>
              <option value="waiver_of_prescription">Waiver of prescription</option>
              <option value="official_bir_extension">Official BIR deadline extension</option>
              <option value="manual_professional_entry">Manual professional entry</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="sourceRecordLink">Source document SharePoint link</label>
          <input id="sourceRecordLink" name="sourceRecordLink" type="url" required />
        </div>
        <button type="submit">Create preliminary deadline version</button>
      </form>
      <small>All machine or manually calculated dates remain preliminary until independently confirmed.</small>
    </section>
  );
}
