export type RiskTier = "low" | "medium" | "high";
export type WorkflowRole =
  | "junior"
  | "senior"
  | "tax_supervisor"
  | "cluster_leader"
  | "hod"
  | "system_admin"
  | "super_admin";

export type MaterialityBasis =
  | "annual_revenue"
  | "annual_tax_paid"
  | "net_assets"
  | "fixed_peso";

export type RiskProfile = {
  basis: MaterialityBasis;
  basisAmount?: number;
  mediumBoundary: number;
  highBoundary: number;
};

export type ExposureInput = {
  basicTax: number;
  surcharge: number;
  interest: number;
};

const riskRank: Record<RiskTier, number> = { low: 1, medium: 2, high: 3 };

function requireNonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must be a non-negative number.`);
}

export function deriveExposureRisk(
  input: ExposureInput,
  profile?: RiskProfile,
  triggers: string[] = [],
  triggerMinimumTiers: Partial<Record<string, RiskTier>> = {},
): { exposure: number; exposureRating: "rated" | "unrated"; tier: RiskTier } {
  requireNonNegative(input.basicTax, "Basic tax");
  requireNonNegative(input.surcharge, "Surcharge");
  requireNonNegative(input.interest, "Interest");
  const exposure = input.basicTax + input.surcharge + input.interest;

  const triggerTier = triggers.reduce<RiskTier | undefined>((highest, trigger) => {
    const configured = triggerMinimumTiers[trigger];
    return configured && (!highest || riskRank[configured] > riskRank[highest]) ? configured : highest;
  }, undefined);
  if (!profile) {
    const tier = triggerTier && riskRank[triggerTier] > riskRank.medium ? triggerTier : "medium";
    return { exposure, exposureRating: "unrated", tier };
  }

  requireNonNegative(profile.mediumBoundary, "Medium boundary");
  requireNonNegative(profile.highBoundary, "High boundary");
  if (profile.highBoundary <= profile.mediumBoundary) {
    throw new RangeError("High boundary must be greater than the medium boundary.");
  }

  const multiplier = profile.basis === "fixed_peso" ? 1 : (profile.basisAmount ?? 0) / 100;
  if (profile.basis !== "fixed_peso" && (!profile.basisAmount || profile.basisAmount <= 0)) {
    throw new RangeError("A positive basis amount is required for percentage materiality.");
  }

  const mediumAmount = profile.mediumBoundary * multiplier;
  const highAmount = profile.highBoundary * multiplier;
  const monetaryTier = exposure >= highAmount ? "high" : exposure >= mediumAmount ? "medium" : "low";
  const tier = triggerTier && riskRank[triggerTier] > riskRank[monetaryTier] ? triggerTier : monetaryTier;
  return { exposure, exposureRating: "rated", tier };
}

export function canChangeRiskTier(
  currentTier: RiskTier,
  nextTier: RiskTier,
  actorRole: WorkflowRole,
  isClientClusterLeader: boolean,
  justification: string,
) {
  if (riskRank[nextTier] >= riskRank[currentTier]) return true;
  if (!justification.trim()) return false;
  return actorRole === "hod" || (actorRole === "cluster_leader" && isClientClusterLeader);
}

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("Date must use YYYY-MM-DD.");
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RangeError("Date must be a valid calendar date.");
  }
  return date;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function subtractDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - days);
  return result;
}

function subtractBusinessDays(date: Date, days: number) {
  const result = new Date(date);
  let remaining = days;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() - 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}

export function calculateInternalDates(
  statutoryDeadline: string,
  today: string,
  settings: { extensionDecisionOffsetDays: number; submissionTargetBusinessDays: number },
) {
  const statutory = parseIsoDate(statutoryDeadline);
  const currentDate = parseIsoDate(today);
  if (
    !Number.isInteger(settings.extensionDecisionOffsetDays)
    || !Number.isInteger(settings.submissionTargetBusinessDays)
    || settings.extensionDecisionOffsetDays <= 0
    || settings.submissionTargetBusinessDays <= 0
  ) {
    throw new RangeError("Deadline offsets must be positive integers.");
  }
  const extensionDecision = subtractDays(statutory, settings.extensionDecisionOffsetDays);
  // shortcut: business days exclude weekends only; add the organization's holiday calendar before production use.
  const submissionTarget = subtractBusinessDays(statutory, settings.submissionTargetBusinessDays);

  return {
    extensionDecisionDate: isoDate(extensionDecision),
    submissionTargetDate: isoDate(submissionTarget),
    escalateImmediately: extensionDecision < currentDate || submissionTarget < currentDate,
  };
}

export function canConfirmDeadline(input: {
  actorId: string;
  actorRole: WorkflowRole;
  receiptRecordedBy: string;
  calculatedBy: string;
}) {
  return (
    (input.actorRole === "tax_supervisor" || input.actorRole === "hod") &&
    input.actorId !== input.receiptRecordedBy &&
    input.actorId !== input.calculatedBy
  );
}

export type CaseAction =
  | "log_notice"
  | "manage_deadline"
  | "draft_extension"
  | "request_extension"
  | "reconciliation"
  | "position_paper"
  | "draft_bir_response"
  | "finalize_bir_response"
  | "release_extension"
  | "release_bir_response";

export type CaseControls = {
  crfStatus: "not_requested" | "sent" | "signed";
  hasWrittenOverride: boolean;
  hasAuthority: boolean;
  hasClientConforme: boolean;
  hasReviewerApproval?: boolean;
};

export function canPerformCaseAction(action: CaseAction, controls: CaseControls) {
  if (["log_notice", "manage_deadline", "draft_extension", "request_extension"].includes(action)) return true;

  const substantiveWorkAllowed = controls.crfStatus === "signed" || controls.hasWrittenOverride;
  if (["reconciliation", "position_paper", "draft_bir_response"].includes(action)) {
    return substantiveWorkAllowed;
  }

  const releaseControlsSatisfied =
    controls.hasAuthority && controls.hasClientConforme && controls.hasReviewerApproval === true;
  if (action === "release_extension") return releaseControlsSatisfied;
  return substantiveWorkAllowed && releaseControlsSatisfied;
}
