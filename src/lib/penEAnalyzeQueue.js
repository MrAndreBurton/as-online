import { supabase } from "./supabase";

export async function fetchPenEAnalyzeQueue({
  page = 1,
  pageSize = 30,
  search = "",
  dateFrom = null,
  dateTo = null,
  studentId = null,
  offeringId = null,
  sourceProvider = null,
} = {}) {
  const { data, error } = await supabase.rpc(
    "aeos_pen_e_analyze_queue",
    {
      p_page: page,
      p_page_size: pageSize,
      p_search: search.trim() || null,
      p_date_from: dateFrom || null,
      p_date_to: dateTo || null,
      p_student_id: studentId || null,
      p_offering_id: offeringId || null,
      p_source_provider: sourceProvider || null,
    }
  );

  if (error) throw error;

  return {
    rows: data?.rows ?? [],
    total: Number(data?.total ?? 0),
    page: Number(data?.page ?? 1),
    pageSize: Number(data?.page_size ?? pageSize),
    pageCount: Number(data?.page_count ?? 0),
  };
}

export async function fetchPenEAnalyzeFilters() {
  const [
    studentsResult,
    offeringsResult,
    providersResult,
  ] = await Promise.all([
    supabase
      .from("aeos_students")
      .select(
        "student_id,first_name,last_name,display_name"
      )
      .eq("student_status", "active")
      .order("first_name"),

    supabase
      .from("aeos_offerings")
      .select(
        "offering_id,offering_name,status"
      )
      .eq("status", "Active")
      .order("offering_name"),

    supabase
      .from("aeos_learning_intake_items")
      .select("source_provider")
      .eq("processing_status", "ready_for_ai")
      .eq("match_status", "matched"),
  ]);

  const results = [
    studentsResult,
    offeringsResult,
    providersResult,
  ];

  const firstError = results.find(
    (result) => result.error
  )?.error;

  if (firstError) throw firstError;

  const providers = [
    ...new Set(
      (providersResult.data ?? [])
        .map((row) => row.source_provider)
        .filter(Boolean)
    ),
  ].sort();

  return {
    students: studentsResult.data ?? [],
    offerings: offeringsResult.data ?? [],
    providers,
  };
}

export async function fetchPenEAnalyzeWorkspace(
  intakeItemId
) {
  const { data, error } = await supabase
    .from("aeos_learning_intake_items")
    .select(`
      intake_item_id,
      intake_type,
      source_provider,
      source_format,
      source_name,
      session_id,
      offering_id,
      processing_status,
      match_status,
      received_at,
      ready_for_ai_at,

      session:aeos_sessions(
        session_id,
        student_id,
        tutor_user_id,
        offering_id,
        session_title,
        session_status,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        ended_at,

        student:aeos_students(
          student_id,
          first_name,
          last_name,
          display_name
        ),

        tutor:tutor_profiles(
          user_id,
          first_name,
          last_name,
          display_name,
          title
        ),

        offering:aeos_offerings(
          offering_id,
          offering_name
        )
      )
    `)
    .eq("intake_item_id", intakeItemId)
    .single();

  if (error) throw error;

  return data;
}

