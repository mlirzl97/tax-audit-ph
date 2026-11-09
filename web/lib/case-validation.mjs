export const noticeTypes = [
  ["loa", "Letter of Authority (LOA/eLA)"],
  ["nod", "Notice of Discrepancy (NOD)"],
  ["nic", "Notice for Informal Conference"],
  ["pan", "Preliminary Assessment Notice (PAN)"],
  ["fan", "Final Assessment Notice / FLD"],
  ["fdda", "Final Decision on Disputed Assessment (FDDA)"],
  ["sdt", "Subpoena Duces Tecum (SDT)"],
  ["mission_order", "Mission Order"],
  ["other", "Other or unknown notice"],
];

export const caseStages = [
  ["engagement_setup", "Engagement set-up"],
  ["received", "Received"],
  ["validating", "Validating"],
  ["triage", "Triage"],
  ["risk_assessment", "Risk and exposure assessment"],
  ["client_data_request", "Client data request"],
  ["reconciliation", "Reconciliation"],
  ["drafting", "Drafting"],
  ["checking", "Checking"],
  ["technical_review", "Technical review"],
  ["client_conforme", "Client conforme"],
  ["submission", "Submission"],
  ["bir_follow_up", "BIR follow-up"],
  ["resolution_or_protest", "Resolution or protest"],
  ["closed", "Closed"],
];

export const checklistStatuses = [
  ["outstanding", "Outstanding"],
  ["available", "Available"],
  ["missing", "Missing"],
  ["professional_help", "Needs professional help"],
];

export const triageAnswers = [
  ["yes", "Yes"],
  ["no", "No"],
  ["not_sure", "I’m not sure"],
];

export const deliveryMethods = [
  ["hand_delivery", "Handed to me or someone at the business"],
  ["mail_courier", "Mail or courier"],
  ["email", "Email"],
  ["bir_portal", "BIR portal or electronic system"],
  ["not_sure", "I’m not sure"],
];

const noticeValues = new Set(noticeTypes.map(([value]) => value));
const stageValues = new Set(caseStages.map(([value]) => value));
const checklistValues = new Set(checklistStatuses.map(([value]) => value));
const triageAnswerValues = new Set(triageAnswers.map(([value]) => value));
const deliveryMethodValues = new Set(deliveryMethods.map(([value]) => value));
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateCaseInput(input) {
  const clientReference = String(input.clientReference ?? "").trim();
  const noticeType = String(input.noticeType ?? "");
  const receivedDate = String(input.receivedDate ?? "");
  const stage = String(input.stage ?? "received");
  const birOfficerPresent = String(input.birOfficerPresent ?? "not_sure");
  const enforcementTermsMentioned = String(input.enforcementTermsMentioned ?? "not_sure");
  const responsePeriodMentioned = String(input.responsePeriodMentioned ?? "not_sure");
  const deliveryMethod = String(input.deliveryMethod ?? "not_sure");
  const errors = [];

  if (clientReference.length < 2 || clientReference.length > 120) {
    errors.push("Client reference must be between 2 and 120 characters.");
  }
  if (!noticeValues.has(noticeType)) errors.push("Select a supported notice type.");
  if (!isoDate.test(receivedDate) || Number.isNaN(Date.parse(`${receivedDate}T00:00:00Z`))) {
    errors.push("Enter a valid receipt date.");
  }
  if (!stageValues.has(stage)) errors.push("Select a valid case stage.");
  if (!triageAnswerValues.has(birOfficerPresent)) errors.push("Select whether a BIR officer is present.");
  if (!triageAnswerValues.has(enforcementTermsMentioned)) errors.push("Select whether the letter mentions enforcement.");
  if (!triageAnswerValues.has(responsePeriodMentioned)) errors.push("Select whether the letter states a response period.");
  if (!deliveryMethodValues.has(deliveryMethod)) errors.push("Select how the letter arrived.");

  return {
    errors,
    values: {
      client_reference: clientReference,
      notice_type: noticeType,
      received_date: receivedDate,
      stage,
      bir_officer_present: birOfficerPresent,
      enforcement_terms_mentioned: enforcementTermsMentioned,
      response_period_mentioned: responsePeriodMentioned,
      delivery_method: deliveryMethod,
    },
  };
}

export function isChecklistStatus(value) {
  return checklistValues.has(value);
}

export function isUuid(value) {
  return uuid.test(String(value ?? ""));
}

export function getProfessionalReviewReasons(caseRecord, checklist = []) {
  const reasons = [];

  if (caseRecord.bir_officer_present === "yes") {
    reasons.push("A BIR officer is present now; prompt CPA or tax-lawyer guidance is recommended.");
  }
  if (caseRecord.enforcement_terms_mentioned === "yes") {
    reasons.push("The letter may contain enforcement or collection language that needs prompt professional review.");
  }
  if (caseRecord.response_period_mentioned === "yes") {
    reasons.push("The letter states a response period; have the applicable deadline confirmed before relying on it.");
  }

  if (caseRecord.notice_type === "pan") {
    reasons.push("A PAN can affect protest rights and needs a professionally confirmed response plan.");
  }
  if (caseRecord.notice_type === "fan") {
    reasons.push("A final assessment notice or FLD warrants prompt CPA or tax-lawyer review.");
  }
  if (["fdda", "sdt", "mission_order"].includes(caseRecord.notice_type)) {
    reasons.push("This notice is a high-risk escalation trigger and needs immediate Tax Team leadership review.");
  }
  if (caseRecord.notice_type === "other") {
    reasons.push("The letter is not yet classified, so do not rely on an assumed deadline or remedy.");
  }
  if (checklist.some((item) => item.status === "missing")) {
    reasons.push("At least one requested record is missing.");
  }
  if (checklist.some((item) => item.status === "professional_help")) {
    reasons.push("You marked a records task as needing professional help.");
  }

  return reasons;
}
