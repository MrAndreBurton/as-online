import { supabase } from "./supabase";

export async function fetchPenEStudents({
  page = 1,
  pageSize = 30,
  search = "",
  studentStatus = "active",
  penEFilter = null,
} = {}) {
  const { data, error } =
    await supabase.rpc(
      "aeos_pen_e_students_page",
      {
        p_page: page,
        p_page_size: pageSize,
        p_search:
          search.trim() || null,
        p_student_status:
          studentStatus || null,
        p_pen_e_filter:
          penEFilter || null,
      }
    );

  if (error) throw error;

  return {
    rows: data?.rows ?? [],
    total: Number(
      data?.total ?? 0
    ),
    page: Number(
      data?.page ?? 1
    ),
    pageSize: Number(
      data?.page_size ??
        pageSize
    ),
    pageCount: Number(
      data?.page_count ??
        0
    ),
  };
}


export async function fetchPenEStudentHistory({
  studentId,
  page = 1,
  pageSize = 30,
  search = "",
  dateFrom = null,
  dateTo = null,
  offeringId = null,
  penEStatus = null,
  reviewStatus = null,
}) {
  const { data, error } =
    await supabase.rpc(
      "aeos_pen_e_student_history",
      {
        p_student_id:
          studentId,

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
    student:
      data?.student ?? null,

    metrics:
      data?.metrics ?? {
        sessions: 0,
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


export async function fetchPenEStudentHistoryFilters(
  studentId
) {
  const {
    data,
    error,
  } = await supabase
    .from(
      "aeos_student_enrolments"
    )
    .select(`
      offering_id,
      status,
      offering:aeos_offerings(
        offering_id,
        offering_name
      )
    `)
    .eq(
      "student_id",
      studentId
    )
    .in(
      "status",
      [
        "active",
        "paused",
        "completed",
      ]
    );

  if (error) throw error;

  const seen =
    new Map();

  for (const row of
    data ?? []) {
    if (
      row.offering &&
      !seen.has(
        row.offering_id
      )
    ) {
      seen.set(
        row.offering_id,
        row.offering
      );
    }
  }

  return [
    ...seen.values(),
  ].sort((a, b) =>
    a.offering_name.localeCompare(
      b.offering_name
    )
  );
}

