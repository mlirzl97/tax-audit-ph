import {
  approveExtension,
  recordCrfOverride,
  recordExtensionPrepared,
  updateCaseControls,
} from "./control-actions";

type CaseControlsRecord = {
  id: string;
  crf_status: "not_requested" | "sent" | "signed";
  crf_record_link: string | null;
  crf_override_reason: string | null;
  authority_type: "none" | "spa" | "authorization_letter";
  authority_record_link: string | null;
  authority_record_version: string | null;
  authority_record_hash: string | null;
  client_conforme_status: "not_requested" | "requested" | "received";
  client_conforme_record_link: string | null;
  extension_prepared_by: string | null;
  extension_approved_by: string | null;
};

export default function CaseControls({ caseRecord }: { caseRecord: CaseControlsRecord }) {
  const saveControls = updateCaseControls.bind(null, caseRecord.id);

  return (
    <section className="workspace-card">
      <p className="eyebrow">Engagement controls</p>
      <h2>CRF, authority and client conforme</h2>
      <form className="case-form" action={saveControls}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="crfStatus">CRF status</label>
            <select id="crfStatus" name="crfStatus" defaultValue={caseRecord.crf_status}>
              <option value="not_requested">Not requested</option>
              <option value="sent">Sent</option>
              <option value="signed">Signed</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="crfRecordLink">Signed CRF SharePoint link</label>
            <input id="crfRecordLink" name="crfRecordLink" type="url" defaultValue={caseRecord.crf_record_link ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="authorityType">Authority to represent</label>
            <select id="authorityType" name="authorityType" defaultValue={caseRecord.authority_type}>
              <option value="none">Not recorded</option>
              <option value="spa">SPA</option>
              <option value="authorization_letter">Authorization letter</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="authorityRecordLink">Authority SharePoint link</label>
            <input id="authorityRecordLink" name="authorityRecordLink" type="url" defaultValue={caseRecord.authority_record_link ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="authorityRecordVersion">SharePoint version ID</label>
            <input id="authorityRecordVersion" name="authorityRecordVersion" defaultValue={caseRecord.authority_record_version ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="authorityRecordHash">File hash</label>
            <input id="authorityRecordHash" name="authorityRecordHash" defaultValue={caseRecord.authority_record_hash ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="clientConformeStatus">Client conforme</label>
            <select id="clientConformeStatus" name="clientConformeStatus" defaultValue={caseRecord.client_conforme_status}>
              <option value="not_requested">Not requested</option>
              <option value="requested">Requested</option>
              <option value="received">Received</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="clientConformeRecordLink">Conforme email or SharePoint link</label>
            <input id="clientConformeRecordLink" name="clientConformeRecordLink" type="url" defaultValue={caseRecord.client_conforme_record_link ?? ""} />
          </div>
        </div>
        <button type="submit">Save engagement controls</button>
      </form>

      {caseRecord.crf_status !== "signed" && (
        <form className="case-form" action={recordCrfOverride.bind(null, caseRecord.id)}>
          <div className="field">
            <label htmlFor="reason">Written CRF override</label>
            <textarea id="reason" name="reason" defaultValue={caseRecord.crf_override_reason ?? ""} minLength={10} required />
            <small>Tax Supervisor or HOD only. The override is permanent audit history.</small>
          </div>
          <button type="submit" className="secondary-button">Record override</button>
        </form>
      )}

      <div className="checklist-list">
        <form className="checklist-item" action={recordExtensionPrepared.bind(null, caseRecord.id)}>
          <label>Extension request preparer</label>
          <div>
            <span>{caseRecord.extension_prepared_by ? "Recorded" : "Not recorded"}</span>
            <button type="submit" className="secondary-button">Mark me as preparer</button>
          </div>
        </form>
        <form className="checklist-item" action={approveExtension.bind(null, caseRecord.id)}>
          <label>Independent extension approval</label>
          <div>
            <span>{caseRecord.extension_approved_by ? "Approved" : "Pending"}</span>
            <button type="submit" className="secondary-button">Approve extension</button>
          </div>
        </form>
      </div>
    </section>
  );
}
