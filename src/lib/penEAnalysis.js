import { supabase } from "./supabase";

async function getFunctionErrorMessage(
  error,
  fallback
) {
  if (!error) {
    return fallback;
  }

  try {
    const response =
      error.context;

    if (
      response &&
      typeof response.clone ===
        "function"
    ) {
      const body =
        await response
          .clone()
          .json();

      if (body?.error) {
        return body.error;
      }

      if (body?.message) {
        return body.message;
      }
    }
  } catch {
    // Fall through to the
    // normal Supabase error.
  }

  return (
    error.message ||
    fallback
  );
}

export async function fetchPenEReadyIntake() {
  const { data, error } =
    await supabase
      .from(
        "aeos_learning_intake_items"
      )
      .select(`
        intake_item_id,
        intake_type,
        source_name,
        processing_status,
        ready_for_ai_at,
        session_id,
        student:student_profiles(
          first_name,
          last_name,
          display_name
        ),
        offering:aeos_offerings(
          offering_name
        ),
        session:aeos_sessions(
          session_title,
          scheduled_start_at
        )
      `)
      .eq(
        "intake_type",
        "transcript"
      )
      .eq(
        "processing_status",
        "ready_for_ai"
      )
      .order(
        "ready_for_ai_at",
        {
          ascending: false,
        }
      );

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function analyzeWithPenE(
  intakeItemId
) {
  const { data, error } =
    await supabase.functions.invoke(
      "pen-e-analyze",
      {
        body: {
          intakeItemId,
        },
      }
    );

  if (error) {
    const message =
      await getFunctionErrorMessage(
        error,
        "Pen-E analysis failed."
      );

    throw new Error(message);
  }

  if (!data?.ok) {
    throw new Error(
      data?.error ||
        "Pen-E analysis failed."
    );
  }

  return data;
}

export async function reanalysePenETranscript(
  intakeItemId
) {
  if (!intakeItemId) {
    throw new Error(
      "This analysis is not linked to a transcript intake item."
    );
  }

  const { data, error } =
    await supabase.functions.invoke(
      "pen-e-reanalyse-transcript",
      {
        body: {
          intakeItemId,
        },
      }
    );

  if (error) {
    const message =
      await getFunctionErrorMessage(
        error,
        "Transcript reanalysis failed."
      );

    throw new Error(message);
  }

  if (!data?.ok) {
    throw new Error(
      data?.error ||
        "Transcript reanalysis failed."
    );
  }

  return data;
}

export async function fetchPenETranscriptScope(
  intakeItemId
) {
  if (!intakeItemId) {
    return null;
  }

  const { data, error } =
    await supabase.rpc(
      "aeos_transcript_analysis_scope",
      {
        target_intake_item_id:
          intakeItemId,
      }
    );

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function fetchPenEAnalysisRun(
  analysisRunId
) {
  const results =
    await Promise.all([
      supabase
        .from(
          "aeos_pen_e_analysis_runs"
        )
        .select(`
          analysis_run_id,
          intake_item_id,
          session_id,
          student_user_id,
          offering_id,
          model_provider,
          model_name,
          prompt_version,
          run_status,
          session_summary,
          overall_confidence,
          error_message,
          started_at,
          completed_at,
          created_at
        `)
        .eq(
          "analysis_run_id",
          analysisRunId
        )
        .single(),

      supabase
        .from(
          "aeos_pen_e_speaker_roles"
        )
        .select("*")
        .eq(
          "analysis_run_id",
          analysisRunId
        )
        .order("created_at"),

      supabase
        .from(
          "aeos_pen_e_curriculum_suggestions"
        )
        .select(`
          *,
          node:aeos_curriculum_nodes(
            curriculum_node_id,
            node_type,
            node_name,
            parent_node_id
          )
        `)
        .eq(
          "analysis_run_id",
          analysisRunId
        )
        .order(
          "confidence",
          {
            ascending: false,
          }
        ),

      supabase
        .from(
          "aeos_pen_e_evidence_suggestions"
        )
        .select(`
          *,
          node:aeos_curriculum_nodes(
            curriculum_node_id,
            node_type,
            node_name
          )
        `)
        .eq(
          "analysis_run_id",
          analysisRunId
        )
        .order("created_at"),

      supabase
        .from(
          "aeos_pen_e_action_suggestions"
        )
        .select("*")
        .eq(
          "analysis_run_id",
          analysisRunId
        )
        .order("created_at"),
    ]);

  const err =
    results.find(
      (result) =>
        result.error
    )?.error;

  if (err) {
    throw err;
  }

  return {
    run:
      results[0].data,

    speakers:
      results[1].data ??
      [],

    curriculum:
      results[2].data ??
      [],

    evidence:
      results[3].data ??
      [],

    actions:
      results[4].data ??
      [],
  };
}

export async function reviewPenESuggestion(
  table,
  id,
  status
) {
  const { error } =
    await supabase.rpc(
      "aeos_review_pen_e_suggestion",
      {
        target_table:
          table,
        target_id: id,
        target_status:
          status,
      }
    );

  if (error) {
    throw error;
  }
}

export async function fetchPenEAnalysisRuns() {
  const { data, error } =
    await supabase
      .from(
        "aeos_pen_e_analysis_runs"
      )
      .select(`
        analysis_run_id,
        intake_item_id,
        session_id,
        student_user_id,
        offering_id,
        model_provider,
        model_name,
        prompt_version,
        run_status,
        session_summary,
        overall_confidence,
        error_message,
        created_at,
        started_at,
        completed_at,
        offering:aeos_offerings(
          offering_id,
          offering_name
        ),
        session:aeos_sessions(
          session_id,
          session_title,
          scheduled_start_at,
          student:aeos_students(
            student_id,
            first_name,
            last_name,
            display_name
          )
        )
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

  if (error) {
    throw error;
  }

  return data ?? [];
}

