import { supabase } from "./supabase";

function unwrap(data, error) {
  if (error) throw error;
  return data;
}

export async function getAiDigitalDiagnosticLaunch(studentUserId) {
  const { data, error } = await supabase.rpc(
    "aeos_get_ai_digital_diagnostic_launch_v1",
    { target_student_user_id: studentUserId }
  );
  return unwrap(data, error);
}

export async function startAiDigitalDiagnostic(studentUserId) {
  const { data, error } = await supabase.rpc(
    "aeos_start_ai_digital_diagnostic_v1",
    { target_student_user_id: studentUserId }
  );
  return unwrap(data, error);
}

export async function getAiDigitalDiagnosticWorkspace(attemptId) {
  const { data, error } = await supabase.rpc(
    "aeos_get_ai_digital_diagnostic_workspace_v1",
    { target_attempt_id: attemptId }
  );
  return unwrap(data, error);
}

export async function saveDiagnosticTask({ responseId, responseStatus, tutorNotes }) {
  const payload = {
    response_status: responseStatus,
    tutor_notes: tutorNotes || null,
    updated_at: new Date().toISOString(),
  };

  if (responseStatus === "captured") {
    payload.started_at = new Date().toISOString();
    payload.completed_at = new Date().toISOString();
  }

  if (responseStatus === "skipped") {
    payload.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("aeos_diagnostic_item_responses")
    .update(payload)
    .eq("diagnostic_item_response_id", responseId)
    .select()
    .single();

  return unwrap(data, error);
}

export async function saveDiagnosticNodeCapture({
  captureId,
  score,
  independenceLevel,
  observationNote,
  artifactReferences = [],
  captureStatus,
}) {
  const resolvedStatus =
    captureStatus ||
    (score === 2 ? "demonstrated" : score === 1 ? "partial" : "not_demonstrated");

  const payload = {
    node_score: score ?? null,
    independence_level: independenceLevel || null,
    capture_status: resolvedStatus,
    observation_note: observationNote || null,
    artifact_references: artifactReferences,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("aeos_diagnostic_node_captures")
    .update(payload)
    .eq("diagnostic_node_capture_id", captureId)
    .select()
    .single();

  return unwrap(data, error);
}

export async function prepareAiDigitalDiagnosticReview(attemptId) {
  const { data, error } = await supabase.rpc(
    "aeos_prepare_ai_digital_diagnostic_review_v1",
    { target_attempt_id: attemptId }
  );
  return unwrap(data, error);
}

export async function createAiDigitalDiagnosticEvidence(captureId) {
  const { data, error } = await supabase.rpc(
    "aeos_create_ai_digital_diagnostic_evidence_v1",
    { target_capture_id: captureId }
  );
  return unwrap(data, error);
}

async function setCaptureReviewDecision(captureId, decision, note = null) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;

  const { data, error } = await supabase
    .from("aeos_diagnostic_node_captures")
    .update({
      review_decision: decision,
      review_note: note || null,
      reviewed_by: userData?.user?.id || null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("diagnostic_node_capture_id", captureId)
    .select()
    .single();

  return unwrap(data, error);
}

export async function approveDiagnosticCapture(capture, note = null) {
  let evidenceId = capture.evidence_id;

  if (!evidenceId) {
    const evidence = await createAiDigitalDiagnosticEvidence(capture.capture_id);
    evidenceId = evidence.evidence_id;
  }

  await setCaptureReviewDecision(capture.capture_id, "approve", note);

  const { data, error } = await supabase.rpc(
    "aeos_approve_ai_digital_evidence_v1",
    { target_evidence_id: evidenceId }
  );

  return unwrap(data, error);
}

export async function rejectDiagnosticCapture(capture, note = null) {
  let evidenceId = capture.evidence_id;

  if (!evidenceId) {
    const evidence = await createAiDigitalDiagnosticEvidence(capture.capture_id);
    evidenceId = evidence.evidence_id;
  }

  await setCaptureReviewDecision(capture.capture_id, "reject", note);

  const { data, error } = await supabase.rpc(
    "aeos_reject_ai_digital_evidence_v1",
    {
      target_evidence_id: evidenceId,
      reason: note || "Rejected during entry diagnostic evidence review.",
    }
  );

  return unwrap(data, error);
}

export async function markDiagnosticCaptureNoEvidence(capture, note = null) {
  if (!capture.evidence_id) {
    await createAiDigitalDiagnosticEvidence(capture.capture_id);
  }
  return setCaptureReviewDecision(capture.capture_id, "no_evidence", note);
}

export async function completeAiDigitalDiagnostic(attemptId) {
  const { data, error } = await supabase.rpc(
    "aeos_complete_ai_digital_diagnostic_v1",
    { target_attempt_id: attemptId }
  );
  return unwrap(data, error);
}

export async function getAiDigitalDiagnosticReadiness(attemptId) {
  const { data, error } = await supabase.rpc(
    "aeos_get_ai_digital_diagnostic_readiness_v1",
    { target_attempt_id: attemptId }
  );
  return unwrap(data, error);
}
