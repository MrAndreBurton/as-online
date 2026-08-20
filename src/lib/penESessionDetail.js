import { supabase } from "./supabase";

export async function fetchPenESessionDetail(
  sessionId
) {
  const [
    sessionResult,
    runsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_sessions")
      .select(`
        session_id,
        student_id,
        student_user_id,
        tutor_user_id,
        offering_id,
        session_title,
        session_status,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        ended_at,
        session_origin,
        attendance_status,
        attendance_notes,

        student:aeos_students!aeos_sessions_student_id_fkey(
          student_id,
          first_name,
          last_name,
          display_name
        ),

        tutor:tutor_profiles!aeos_sessions_tutor_user_id_fkey(
          user_id,
          first_name,
          last_name,
          display_name,
          title
        ),

        offering:aeos_offerings!aeos_sessions_offering_id_fkey(
          offering_id,
          offering_name,
          programme_id,
          subject_id,
          audience_level_id
        )
      `)
      .eq(
        "session_id",
        sessionId
      )
      .single(),

    supabase
      .from(
        "aeos_pen_e_analysis_runs"
      )
      .select(`
        analysis_run_id,
        intake_item_id,
        session_id,
        run_status,
        model_provider,
        model_name,
        prompt_version,
        session_summary,
        overall_confidence,
        error_message,
        started_at,
        completed_at,
        created_at
      `)
      .eq(
        "session_id",
        sessionId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),
  ]);

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (runsResult.error) {
    throw runsResult.error;
  }

  const runs =
    runsResult.data ?? [];

  const completedRuns =
    runs
      .filter(
        (run) =>
          run.run_status ===
          "completed"
      )
      .sort((a, b) => {
        const aTime =
          new Date(
            a.completed_at ||
              a.created_at
          ).getTime();

        const bTime =
          new Date(
            b.completed_at ||
              b.created_at
          ).getTime();

        return bTime - aTime;
      });

  return {
    session:
      sessionResult.data,

    runs,

    completedRuns,

    latestCompletedRun:
      completedRuns[0] ?? null,
  };
}

