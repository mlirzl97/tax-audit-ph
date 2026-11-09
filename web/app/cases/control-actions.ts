"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "../../lib/auth";
import { isUuid } from "../../lib/case-validation.mjs";

const crfStatuses = new Set(["not_requested", "sent", "signed"]);
const authorityTypes = new Set(["none", "spa", "authorization_letter"]);
const conformeStatuses = new Set(["not_requested", "requested", "received"]);
const deadlineSources = new Set([
  "notice_receipt",
  "extension_acknowledgement",
  "amended_or_reissued_notice",
  "additional_bir_request",
  "meeting_minutes",
  "corrected_receipt_date",
  "waiver_of_prescription",
  "official_bir_extension",
  "manual_professional_entry",
]);

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function isHttpsLink(link: string) {
  if (!link || link.length > 2_000) return false;
  try {
    return new URL(link).protocol === "https:";
  } catch {
    return false;
  }
}

function fail(caseId: string, message: string): never {
  redirect(`/cases/${caseId}?error=${encodeURIComponent(message)}`);
}

export async function updateCaseControls(caseId: string, formData: FormData) {
  if (!isUuid(caseId)) redirect("/cases?error=Invalid+case+identifier.");
  const crfStatus = value(formData, "crfStatus");
  const authorityType = value(formData, "authorityType");
  const clientConformeStatus = value(formData, "clientConformeStatus");
  if (!crfStatuses.has(crfStatus) || !authorityTypes.has(authorityType) || !conformeStatuses.has(clientConformeStatus)) {
    fail(caseId, "Invalid engagement control status.");
  }
  const crfRecordLink = value(formData, "crfRecordLink");
  const authorityRecordLink = value(formData, "authorityRecordLink");
  const clientConformeRecordLink = value(formData, "clientConformeRecordLink");
  if (
    (crfRecordLink && !isHttpsLink(crfRecordLink))
    || (authorityRecordLink && !isHttpsLink(authorityRecordLink))
    || (clientConformeRecordLink && !isHttpsLink(clientConformeRecordLink))
  ) {
    fail(caseId, "Record links must use HTTPS.");
  }
  const authorityRecordVersion = value(formData, "authorityRecordVersion");
  const authorityRecordHash = value(formData, "authorityRecordHash");
  if (authorityRecordVersion.length > 240 || authorityRecordHash.length > 240) {
    fail(caseId, "SharePoint version IDs and hashes must be 240 characters or fewer.");
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("audit_cases")
    .update({
      crf_status: crfStatus,
      crf_record_link: crfRecordLink || null,
      authority_type: authorityType,
      authority_record_link: authorityRecordLink || null,
      authority_record_version: authorityRecordVersion || null,
      authority_record_hash: authorityRecordHash || null,
      client_conforme_status: clientConformeStatus,
      client_conforme_record_link: clientConformeRecordLink || null,
    })
    .eq("id", caseId)
    .select("id")
    .single();

  if (error || !data) fail(caseId, "The engagement controls could not be updated.");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?saved=controls`);
}

export async function recordCrfOverride(caseId: string, formData: FormData) {
  if (!isUuid(caseId)) redirect("/cases?error=Invalid+case+identifier.");
  const reason = value(formData, "reason");
  if (reason.length < 10 || reason.length > 2_000) {
    fail(caseId, "A written override reason must be between 10 and 2,000 characters.");
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("audit_cases")
    .update({ crf_override_reason: reason })
    .eq("id", caseId)
    .select("id")
    .single();

  if (error || !data) fail(caseId, "Only the Tax Supervisor or HOD may record this override.");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?saved=override`);
}

export async function recordExtensionPrepared(caseId: string, _formData: FormData) {
  if (!isUuid(caseId)) redirect("/cases?error=Invalid+case+identifier.");
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("audit_cases")
    .update({ extension_prepared_by: userId })
    .eq("id", caseId)
    .select("id")
    .single();

  if (error || !data) fail(caseId, "The extension preparer could not be recorded.");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?saved=extension_prepared`);
}

export async function approveExtension(caseId: string, _formData: FormData) {
  if (!isUuid(caseId)) redirect("/cases?error=Invalid+case+identifier.");
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("audit_cases")
    .update({ extension_approved_by: userId })
    .eq("id", caseId)
    .select("id")
    .single();

  if (error || !data) fail(caseId, "Extension approval requires an independent Tax Supervisor or HOD.");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?saved=extension_approved`);
}

export async function createPreliminaryDeadline(caseId: string, formData: FormData) {
  if (!isUuid(caseId)) redirect("/cases?error=Invalid+case+identifier.");
  const deadlineDate = value(formData, "deadlineDate");
  const sourceEvent = value(formData, "sourceEvent");
  const sourceRecordLink = value(formData, "sourceRecordLink");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate) || Number.isNaN(Date.parse(`${deadlineDate}T00:00:00Z`))) {
    fail(caseId, "Enter a valid preliminary deadline.");
  }
  if (!deadlineSources.has(sourceEvent) || !isHttpsLink(sourceRecordLink)) {
    fail(caseId, "Select a deadline source and provide its SharePoint link.");
  }

  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("create_preliminary_deadline", {
    target_case_id: caseId,
    target_deadline_date: deadlineDate,
    target_source_event: sourceEvent,
    target_source_record_link: sourceRecordLink,
    target_rule_id: null,
  });

  if (error) fail(caseId, "The preliminary deadline could not be created.");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?saved=deadline`);
}

export async function confirmDeadline(caseId: string, deadlineId: string, _formData: FormData) {
  if (!isUuid(caseId) || !isUuid(deadlineId)) redirect("/cases?error=Invalid+deadline+identifier.");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("confirm_deadline", { target_deadline_id: deadlineId });

  if (error) fail(caseId, "Deadline confirmation requires an independent Tax Supervisor or HOD.");
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?saved=deadline_confirmed`);
}
