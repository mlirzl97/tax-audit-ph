export const noticeGuidance = {
  loa: {
    label: "Letter of Authority (LOA/eLA)",
    action: "Preserve the authority and attachments, then have a professional confirm its scope, service, and covered period before releasing records.",
  },
  nod: {
    label: "Notice of Discrepancy (NOD)",
    action: "List each discrepancy separately and begin a return-to-books-to-source-document reconciliation. Do not answer from memory.",
  },
  nic: {
    label: "Notice for Informal Conference",
    action: "Preserve the findings and prior submissions, then map every finding to supporting evidence and unresolved differences.",
  },
  pan: {
    label: "Preliminary Assessment Notice (PAN)",
    action: "Escalate promptly for professional deadline confirmation and prepare a finding-by-finding response package with proof of submission.",
  },
  fan: {
    label: "Final Assessment Notice / FLD",
    action: "Seek immediate CPA or tax-lawyer review. Record the exact receipt details and preserve every prior notice, response, and submission receipt.",
  },
  other: {
    label: "Other or unknown notice",
    action: "Do not guess the notice type. Preserve every page and attachment and ask a professional to classify it before relying on a deadline.",
  },
};

export function getNoticeGuidance(noticeType) {
  return noticeGuidance[noticeType] ?? null;
}
