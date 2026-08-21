import { supabase } from "./supabase";


export async function fetchStudentReportsPage({
  page = 1,
  pageSize = 30,
  search = "",
  studentStatus = "active",
} = {}) {
  const { data, error } =
    await supabase.rpc(
      "aeos_student_reports_page",
      {
        p_page: page,
        p_page_size: pageSize,
        p_search:
          search.trim() || null,
        p_student_status:
          studentStatus || null,
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
      data?.page_count ?? 0
    ),
  };
}


export async function fetchStudentReportCenter(
  studentId
) {
  const { data, error } =
    await supabase.rpc(
      "aeos_student_report_center",
      {
        p_student_id:
          studentId,
      }
    );

  if (error) throw error;

  return data;
}


export async function createStudentReport({
  studentId,
  reportType,
  periodStart,
  periodEnd,
  reportTitle = null,
}) {
  const { data, error } =
    await supabase.rpc(
      "aeos_create_student_report",
      {
        p_student_id:
          studentId,

        p_report_type:
          reportType,

        p_period_start:
          periodStart,

        p_period_end:
          periodEnd,

        p_report_title:
          reportTitle ||
          null,
      }
    );

  if (error) throw error;

  return data;
}


export async function fetchStudentReport(
  reportId
) {
  const { data, error } =
    await supabase.rpc(
      "aeos_get_student_report",
      {
        p_report_id:
          reportId,
      }
    );

  if (error) throw error;

  return data;
}


export async function saveStudentReportContent(
  reportId,
  reportContent
) {
  const { data, error } =
    await supabase.rpc(
      "aeos_save_student_report_content",
      {
        p_report_id:
          reportId,

        p_report_content:
          reportContent,
      }
    );

  if (error) throw error;

  return data;
}


export async function markStudentReportReviewed(
  reportId
) {
  const { data, error } =
    await supabase.rpc(
      "aeos_mark_student_report_reviewed",
      {
        p_report_id:
          reportId,
      }
    );

  if (error) throw error;

  return data;
}


export async function finalizeStudentReport(
  reportId
) {
  const { data, error } =
    await supabase.rpc(
      "aeos_finalize_student_report",
      {
        p_report_id:
          reportId,
      }
    );

  if (error) throw error;

  return data;
}


export async function reopenStudentReport(
  reportId
) {
  const { data, error } =
    await supabase.rpc(
      "aeos_reopen_student_report",
      {
        p_report_id:
          reportId,
      }
    );

  if (error) throw error;

  return data;
}

export async function downloadStudentReportPdf(
  reportId
) {
  const {
    data: {
      session,
    },
    error:
      sessionError,
  } =
    await supabase.auth
      .getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      "You must be signed in to download a report."
    );
  }

  const supabaseUrl =
    import.meta.env
      .VITE_SUPABASE_URL;

  const supabaseAnonKey =
    import.meta.env
      .VITE_SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Supabase configuration is missing."
    );
  }

  const response =
    await fetch(
      `${supabaseUrl}/functions/v1/generate-student-report-pdf`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${session.access_token}`,

          apikey:
            supabaseAnonKey,

          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify({
            report_id:
              reportId,
          }),
      }
    );


  if (!response.ok) {
    let message =
      "Student report PDF could not be generated.";

    try {
      const result =
        await response.json();

      if (result?.error) {
        message =
          result.error;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(
      message
    );
  }


  const blob =
    await response.blob();

  const disposition =
    response.headers.get(
      "Content-Disposition"
    );

  const match =
    disposition?.match(
      /filename="([^"]+)"/i
    );

  const filename =
    match?.[1] ||
    `student-report-${reportId}.pdf`;


  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;
  link.download = filename;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );

  return {
    filename,
  };
}


