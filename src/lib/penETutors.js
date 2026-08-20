import { supabase } from "./supabase";


export async function fetchPenETutors({
  page = 1,
  pageSize = 30,
  search = "",
  penEFilter = null,
} = {}) {
  const { data, error } =
    await supabase.rpc(
      "aeos_pen_e_tutors_page",
      {
        p_page: page,
        p_page_size: pageSize,
        p_search:
          search.trim() || null,
        p_pen_e_filter:
          penEFilter || null,
      }
    );

  if (error) throw error;

  return {
    rows:
      data?.rows ?? [],

    total:
      Number(
        data?.total ?? 0
      ),

    page:
      Number(
        data?.page ?? 1
      ),

    pageSize:
      Number(
        data?.page_size ??
          pageSize
      ),

    pageCount:
      Number(
        data?.page_count ??
          0
      ),
  };
}


export async function fetchPenETutorHistory({
  tutorUserId,
  page = 1,
  pageSize = 30,
  search = "",
  dateFrom = null,
  dateTo = null,
  studentId = null,
  offeringId = null,
  penEStatus = null,
  reviewStatus = null,
}) {
  const { data, error } =
    await supabase.rpc(
      "aeos_pen_e_tutor_history",
      {
        p_tutor_user_id:
          tutorUserId,

        p_page:
          page,

        p_page_size:
          pageSize,

        p_search:
          search.trim() || null,

        p_date_from:
          dateFrom || null,

        p_date_to:
          dateTo || null,

        p_student_id:
          studentId || null,

        p_offering_id:
          offeringId || null,

        p_pen_e_status:
          penEStatus || null,

        p_review_status:
          reviewStatus || null,
      }
    );

  if (error) throw error;

  return {
    tutor:
      data?.tutor ?? null,

    metrics:
      data?.metrics ?? {
        sessions: 0,
        students: 0,
        hours_tutored: 0,
        analysed: 0,
        analysis_coverage_percent: 0,
        last_session_at: null,
      },

    rows:
      data?.rows ?? [],

    total:
      Number(
        data?.total ?? 0
      ),

    page:
      Number(
        data?.page ?? 1
      ),

    pageSize:
      Number(
        data?.page_size ??
          pageSize
      ),

    pageCount:
      Number(
        data?.page_count ??
          0
      ),
  };
}


export async function fetchPenETutorHistoryFilters(
  tutorUserId
) {
  const [
    studentsResult,
    offeringsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_sessions")
      .select(`
        student_id,
        student:aeos_students(
          student_id,
          first_name,
          last_name,
          display_name
        )
      `)
      .eq(
        "tutor_user_id",
        tutorUserId
      )
      .eq(
        "session_status",
        "completed"
      ),

    supabase
      .from("aeos_sessions")
      .select(`
        offering_id,
        offering:aeos_offerings(
          offering_id,
          offering_name
        )
      `)
      .eq(
        "tutor_user_id",
        tutorUserId
      )
      .eq(
        "session_status",
        "completed"
      ),
  ]);

  const firstError = [
    studentsResult,
    offeringsResult,
  ].find(
    (result) =>
      result.error
  )?.error;

  if (firstError) {
    throw firstError;
  }

  const studentMap =
    new Map();

  for (const row of
    studentsResult.data ?? []) {
    if (
      row.student &&
      !studentMap.has(
        row.student_id
      )
    ) {
      studentMap.set(
        row.student_id,
        row.student
      );
    }
  }

  const offeringMap =
    new Map();

  for (const row of
    offeringsResult.data ?? []) {
    if (
      row.offering &&
      !offeringMap.has(
        row.offering_id
      )
    ) {
      offeringMap.set(
        row.offering_id,
        row.offering
      );
    }
  }

  return {
    students: [
      ...studentMap.values(),
    ].sort((a, b) =>
      (
        a.display_name ||
        a.first_name ||
        ""
      ).localeCompare(
        b.display_name ||
        b.first_name ||
        ""
      )
    ),

    offerings: [
      ...offeringMap.values(),
    ].sort((a, b) =>
      a.offering_name.localeCompare(
        b.offering_name
      )
    ),
  };
}

