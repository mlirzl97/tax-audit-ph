"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  isChecklistStatus,
  isUuid,
  validateCaseInput,
} from "../../lib/case-validation.mjs";
import { requireUser } from "../../lib/auth";

async function firstMembership(supabase) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (error || !data) throw new Error("No workspace membership is available.");
  return data.organization_id;
}

export async function createCase(_previousState, formData) {
  const { supabase, userId } = await requireUser();
  const receivedDate = String(formData.get("receivedDate") ?? "");
  const noticeType = String(formData.get("noticeType") ?? "");
  const { errors, values } = validateCaseInput({
    clientReference: formData.get("clientReference") || `BIR ${noticeType === "other" ? "letter" : noticeType.toUpperCase()} — ${receivedDate}`,
    noticeType,
    receivedDate,
    stage: formData.get("stage"),
    birOfficerPresent: formData.get("birOfficerPresent"),
    enforcementTermsMentioned: formData.get("enforcementTermsMentioned"),
    responsePeriodMentioned: formData.get("responsePeriodMentioned"),
    deliveryMethod: formData.get("deliveryMethod"),
  });
  if (errors.length) return { error: errors[0] };

  const organizationId = await firstMembership(supabase);
  const { data, error } = await supabase
    .from("audit_cases")
    .insert({
      ...values,
      organization_id: organizationId,
      created_by: userId,
      receipt_recorded_by: userId,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "The case could not be created." };
  redirect(`/cases/${data.id}`);
}

export async function updateCase(caseId, formData) {
  if (!isUuid(caseId)) redirect("/cases?error=Invalid+case+identifier.");
  const { supabase } = await requireUser();
  const { errors, values } = validateCaseInput({
    clientReference: formData.get("clientReference"),
    noticeType: formData.get("noticeType"),
    receivedDate: formData.get("receivedDate"),
    stage: formData.get("stage"),
    birOfficerPresent: formData.get("birOfficerPresent"),
    enforcementTermsMentioned: formData.get("enforcementTermsMentioned"),
    responsePeriodMentioned: formData.get("responsePeriodMentioned"),
    deliveryMethod: formData.get("deliveryMethod"),
  });
  if (errors.length) redirect(`/cases/${caseId}?error=${encodeURIComponent(errors[0])}`);

  const { data, error } = await supabase
    .from("audit_cases")
    .update(values)
    .eq("id", caseId)
    .select("id")
    .single();

  if (error || !data) redirect(`/cases/${caseId}?error=The+case+could+not+be+updated.`);
  revalidatePath(`/cases/${caseId}`);
  redirect(`/cases/${caseId}?saved=1`);
}

export async function updateChecklist(caseId, itemId, formData) {
  const status = String(formData.get("status") ?? "");
  if (!isUuid(caseId) || !isUuid(itemId) || !isChecklistStatus(status)) {
    redirect(`/cases/${caseId}?error=Invalid+checklist+update.`);
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("case_checklist")
    .update({ status })
    .eq("id", itemId)
    .eq("case_id", caseId)
    .select("id")
    .single();

  if (error || !data) redirect(`/cases/${caseId}?error=The+checklist+could+not+be+updated.`);
  revalidatePath(`/cases/${caseId}`);
}
