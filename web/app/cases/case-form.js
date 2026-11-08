import { caseStages, noticeTypes } from "../../lib/case-validation.mjs";

export default function CaseForm({ action, caseRecord, submitLabel }) {
  return (
    <form className="case-form" action={action}>
      <input type="hidden" name="birOfficerPresent" value={caseRecord?.bir_officer_present ?? "not_sure"} />
      <input type="hidden" name="enforcementTermsMentioned" value={caseRecord?.enforcement_terms_mentioned ?? "not_sure"} />
      <input type="hidden" name="responsePeriodMentioned" value={caseRecord?.response_period_mentioned ?? "not_sure"} />
      <input type="hidden" name="deliveryMethod" value={caseRecord?.delivery_method ?? "not_sure"} />
      <div className="field">
        <label htmlFor="clientReference">What should we call this case?</label>
        <input
          id="clientReference"
          name="clientReference"
          defaultValue={caseRecord?.client_reference ?? ""}
          maxLength="120"
          required
        />
        <small>Use a short nickname or internal reference. Do not enter a TIN.</small>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="noticeType">What letter did you receive?</label>
          <select
            id="noticeType"
            name="noticeType"
            defaultValue={caseRecord?.notice_type ?? ""}
            required
          >
            <option value="" disabled>Select the closest match</option>
            {noticeTypes.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="receivedDate">When did you actually receive it?</label>
          <input
            id="receivedDate"
            name="receivedDate"
            type="date"
            defaultValue={caseRecord?.received_date ?? ""}
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="stage">Case stage</label>
        <select id="stage" name="stage" defaultValue={caseRecord.stage} required>
          {caseStages.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div className="form-warning">
        Receipt date is recorded as evidence. This system does not confirm a legal deadline.
      </div>
      <button type="submit">{submitLabel}</button>
    </form>
  );
}
