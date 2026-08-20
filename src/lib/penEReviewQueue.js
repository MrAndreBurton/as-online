import { supabase } from "./supabase";

export async function fetchPenEReviewQueue({
  page = 1,
  pageSize = 30,
  search = "",
  dateFrom = null,
  dateTo = null,
  studentId = null,
  offeringId = null,
} = {}) {
  const { data, error } =
    await supabase.rpc(
      "aeos_pen_e_review_queue",
      {
        p_page: page,
        p_page_size: pageSize,

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


export async function fetchPenEReviewFilters() {
  const [
    studentsResult,
    offeringsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_students")
      .select(
        "student_id,first_name,last_name,display_name"
      )
      .eq(
        "student_status",
        "active"
      )
      .order("first_name"),

    supabase
      .from("aeos_offerings")
      .select(
        "offering_id,offering_name,status"
      )
      .eq(
        "status",
        "Active"
      )
      .order(
        "offering_name"
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

  return {
    students:
      studentsResult.data ??
      [],

    offerings:
      offeringsResult.data ??
      [],
  };
}

