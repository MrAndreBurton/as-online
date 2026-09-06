import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function env(name: string, required = true) {
  const value = Deno.env.get(name);
  if (required && !value) throw new Error(`Missing secret: ${name}`);
  return value ?? "";
}

function adminKey() {
  const modern = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (modern) {
    const parsed = JSON.parse(modern);
    if (parsed?.default) return parsed.default;
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  throw new Error("No Supabase server-side secret key available.");
}

function publishableKey() {
  const modern = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (modern) {
    const parsed = JSON.parse(modern);
    if (parsed?.default) return parsed.default;
  }
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  throw new Error("No Supabase publishable key available.");
}

async function verifyAdminTutor(req: Request, supabaseUrl: string) {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Authentication required.");

  const client = createClient(supabaseUrl, publishableKey(), {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Invalid AEOS session.");

  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id,app_role,is_active")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.app_role !== "admin_tutor" || !profile?.is_active) {
    throw new Error("Admin/Tutor access required.");
  }

  return user;
}

async function googleAccessToken() {
  const params = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    client_secret: env("GOOGLE_CLIENT_SECRET"),
    refresh_token: env("GOOGLE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const body = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Google token refresh failed: ${body.error_description || body.error || response.status}`);
  }
  return body.access_token as string;
}

async function googleRequest(accessToken: string, url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Google Calendar request failed: ${body?.error?.message || body?.error || response.status}`);
  }
  return body;
}

function calendarUrl(calendarId: string, path = "") {
  return `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events${path}`;
}

function meetUrl(event: any) {
  return event?.hangoutLink || event?.conferenceData?.entryPoints?.find((entry: any) => entry.entryPointType === "video")?.uri || null;
}

function recurrenceUntil(endDate: string) {
  const until = new Date(`${endDate}T23:59:59-04:00`);
  return until.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function weekdayCode(localDateTime: string) {
  const d = new Date(localDateTime);
  const codes = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  return codes[d.getDay()];
}

function isoFromGoogleDate(value: any) {
  return value?.dateTime || (value?.date ? `${value.date}T00:00:00Z` : null);
}

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

function displayStudentName(student: any, fallback: string) {
  return (
    String(student?.display_name || "").trim() ||
    [student?.first_name, student?.last_name].filter(Boolean).join(" ").trim() ||
    fallback
  );
}

async function resolveStudentAndOffering(admin: any, studentIdInput: string, studentUserIdInput: string, offeringId: string, studentEmailInput: string) {
  let studentQuery = admin
    .from("aeos_students")
    .select("student_id,portal_user_id,first_name,last_name,display_name,email");

  if (studentIdInput) studentQuery = studentQuery.eq("student_id", studentIdInput);
  else if (studentUserIdInput) studentQuery = studentQuery.eq("portal_user_id", studentUserIdInput);
  else throw new Error("Student is required.");

  const { data: student, error: studentError } = await studentQuery.single();
  if (studentError || !student) throw new Error("AEOS Student not found.");

  if (studentUserIdInput && student.portal_user_id && studentUserIdInput !== student.portal_user_id) {
    throw new Error("Student portal identity does not match the AEOS student record.");
  }

  const { data: enrolment, error: enrolmentError } = await admin
    .from("aeos_student_enrolments")
    .select("enrolment_id")
    .eq("student_id", student.student_id)
    .eq("offering_id", offeringId)
    .in("status", ["active", "paused"])
    .maybeSingle();

  if (enrolmentError) throw enrolmentError;
  if (!enrolment) throw new Error("Student is not enrolled in this Offering.");

  let studentEmail = String(student.email || studentEmailInput || "").trim();
  const studentUserId = student.portal_user_id || null;

  if (!studentEmail && studentUserId) {
    const { data: profile } = await admin.from("profiles").select("email").eq("id", studentUserId).single();
    if (profile?.email) studentEmail = profile.email;
  }
  if (!studentEmail) throw new Error("Student email unavailable.");

  const { data: offering, error: offeringError } = await admin
    .from("aeos_offerings")
    .select("offering_name,subject:aeos_subjects(subject_name)")
    .eq("offering_id", offeringId)
    .single();
  if (offeringError) throw offeringError;

  return { student, studentId: student.student_id, studentUserId, studentEmail, offering };
}

async function reconcileSeries(admin: any, series: any) {
  if (!series.google_recurring_event_id) throw new Error("Series is not linked to Google Calendar.");

  const token = await googleAccessToken();
  const calendarId = series.google_calendar_id || env("GOOGLE_CALENDAR_ID", false) || "primary";
  const timeMin = new Date(new Date(series.starts_at).getTime() - 24 * 60 * 60 * 1000).toISOString();
  const timeMax = new Date(`${series.ends_on}T23:59:59-04:00`).toISOString();
  const query = new URLSearchParams({ timeMin, timeMax, showDeleted: "true", maxResults: "2500" });

  const response = await googleRequest(token, `${calendarUrl(calendarId, `/${encodeURIComponent(series.google_recurring_event_id)}/instances`)}?${query}`);
  const items = response?.items ?? [];
  let inserted = 0, updated = 0, exceptions = 0, cancelled = 0;

  for (const event of items) {
    const recurringEventId = event.recurringEventId || series.google_recurring_event_id;
    const originalStart = isoFromGoogleDate(event.originalStartTime);
    if (!originalStart) continue;

    const { data: existing, error: existingError } = await admin
      .from("aeos_sessions")
      .select("session_id,scheduled_start_at,scheduled_end_at,original_scheduled_start_at,original_scheduled_end_at")
      .eq("google_calendar_id", calendarId)
      .eq("google_recurring_event_id", recurringEventId)
      .eq("google_original_start_time", originalStart)
      .maybeSingle();
    if (existingError) throw existingError;

    const isCancelled = event.status === "cancelled";
    const actualStart = isoFromGoogleDate(event.start) || existing?.scheduled_start_at || originalStart;
    const actualEnd = isoFromGoogleDate(event.end) || existing?.scheduled_end_at || addMinutes(actualStart, series.duration_minutes);
    const isRescheduled = !isCancelled && new Date(actualStart).getTime() !== new Date(originalStart).getTime();
    const isException = isCancelled || isRescheduled;
    if (isException) exceptions += 1;
    if (isCancelled) cancelled += 1;

    const common = {
      series_id: series.series_id,
      google_calendar_id: calendarId,
      google_calendar_event_id: event.id,
      google_recurring_event_id: recurringEventId,
      google_original_start_time: originalStart,
      google_meet_url: meetUrl(event),
      google_sync_status: "synced",
      google_synced_at: new Date().toISOString(),
      google_sync_error: null,
      calendar_reconciled_at: new Date().toISOString(),
      is_series_exception: isException,
      series_exception_type: isCancelled ? "cancelled" : isRescheduled ? "rescheduled" : null,
      series_exception_source: isException ? "google_calendar" : null,
    };

    if (existing) {
      const patch: any = { ...common, session_status: isCancelled ? "cancelled" : "scheduled", scheduled_start_at: actualStart, scheduled_end_at: actualEnd };
      if (isException && !existing.original_scheduled_start_at) {
        patch.original_scheduled_start_at = originalStart;
        patch.original_scheduled_end_at = addMinutes(originalStart, series.duration_minutes);
      }
      const { error } = await admin.from("aeos_sessions").update(patch).eq("session_id", existing.session_id);
      if (error) throw error;
      updated += 1;
    } else {
      const { error } = await admin.from("aeos_sessions").insert({
        student_id: series.student_id,
        student_user_id: series.student_user_id || null,
        tutor_user_id: series.tutor_user_id,
        offering_id: series.offering_id,
        session_title: series.series_title,
        session_status: isCancelled ? "cancelled" : "scheduled",
        scheduled_start_at: actualStart,
        scheduled_end_at: actualEnd,
        original_scheduled_start_at: isException ? originalStart : null,
        original_scheduled_end_at: isException ? addMinutes(originalStart, series.duration_minutes) : null,
        calendar_timezone: series.timezone,
        ...common,
        created_by: series.created_by,
      });
      if (error) throw error;
      inserted += 1;
    }
  }

  await admin.from("aeos_session_series").update({ google_sync_status: "synced", google_synced_at: new Date().toISOString(), google_sync_error: null }).eq("series_id", series.series_id);
  return { instanceCount: items.length, inserted, updated, exceptions, cancelled };
}

async function createSeries(body: any, caller: any, admin: any) {
  const studentIdInput = String(body.studentId || "");
  const studentUserIdInput = String(body.studentUserId || "");
  const studentEmailInput = String(body.studentEmail || "");
  const offeringId = String(body.offeringId || "");
  const startTime = String(body.startTime || "");
  const endDate = String(body.endDate || "");
  const durationMinutes = Number(body.durationMinutes || 60);
  const sessionTitle = String(body.sessionTitle || "").trim() || null;
  const timezone = String(body.timezone || "").trim() || env("GOOGLE_TIMEZONE", false) || "America/Port_of_Spain";

  if ((!studentIdInput && !studentUserIdInput) || !offeringId || !startTime || !endDate) {
    throw new Error("Student, Offering, start time and recurrence end date are required.");
  }
  if (Number.isNaN(new Date(startTime).getTime())) throw new Error("Invalid start time.");
  if (durationMinutes <= 0) throw new Error("Invalid duration.");

  const { student, studentId, studentUserId, studentEmail, offering } = await resolveStudentAndOffering(
    admin, studentIdInput, studentUserIdInput, offeringId, studentEmailInput
  );

  const studentName = displayStudentName(student, studentEmail);
  const defaultSessionTitle = `${studentName} — ${offering.offering_name}`;
  const resolvedSessionTitle = sessionTitle || defaultSessionTitle;

  const byDay = weekdayCode(startTime);
  const rrule = `RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=${byDay};UNTIL=${recurrenceUntil(endDate)}`;

  const { data: series, error: seriesError } = await admin
    .from("aeos_session_series")
    .insert({
      student_id: studentId,
      student_user_id: studentUserId,
      tutor_user_id: caller.id,
      offering_id: offeringId,
      series_title: resolvedSessionTitle,
      recurrence_lines: [rrule],
      recurrence_frequency: "weekly",
      recurrence_interval: 1,
      recurrence_weekdays: [byDay],
      starts_at: startTime,
      ends_on: endDate,
      duration_minutes: durationMinutes,
      timezone,
      series_status: "active",
      google_sync_status: "pending",
      created_by: caller.id,
    })
    .select()
    .single();
  if (seriesError) throw seriesError;

  const calendarId = env("GOOGLE_CALENDAR_ID", false) || "primary";

  try {
    const token = await googleAccessToken();
    const endTime = addMinutes(startTime, durationMinutes);
    const googleEvent = {
      summary: resolvedSessionTitle,
      description: [
        "A's Online recurring tutoring session",
        `Student: ${studentName}`,
        `Offering: ${offering.offering_name}`,
        offering.subject?.subject_name ? `Subject: ${offering.subject.subject_name}` : null,
        `AEOS Series ID: ${series.series_id}`,
      ].filter(Boolean).join("\n"),
      start: { dateTime: startTime, timeZone: timezone },
      end: { dateTime: endTime, timeZone: timezone },
      attendees: [{ email: studentEmail }],
      recurrence: [rrule],
      conferenceData: { createRequest: { requestId: crypto.randomUUID() } },
      extendedProperties: { private: { aeos_series_id: series.series_id } },
    };

    const query = new URLSearchParams({ conferenceDataVersion: "1", sendUpdates: "all" });
    const created = await googleRequest(token, `${calendarUrl(calendarId)}?${query}`, { method: "POST", body: JSON.stringify(googleEvent) });

    const { error: updateError } = await admin.from("aeos_session_series").update({
      google_calendar_id: calendarId,
      google_recurring_event_id: created.id,
      google_event_html_link: created.htmlLink || null,
      google_sync_status: "synced",
      google_synced_at: new Date().toISOString(),
      google_sync_error: null,
    }).eq("series_id", series.series_id);
    if (updateError) throw updateError;

    const refreshedSeries = {
      ...series,
      series_title: resolvedSessionTitle,
      google_calendar_id: calendarId,
      google_recurring_event_id: created.id,
      google_event_html_link: created.htmlLink || null,
    };

    const reconciliation = await reconcileSeries(admin, refreshedSeries);
    return {
      ok: true,
      action: "create_series",
      seriesId: series.series_id,
      recurringEventId: created.id,
      calendarLink: created.htmlLink || null,
      recurrence: [rrule],
      reconciliation,
    };
  } catch (error) {
    await admin.from("aeos_session_series").update({
      google_sync_status: "failed",
      google_sync_error: error instanceof Error ? error.message : String(error),
    }).eq("series_id", series.series_id);
    throw error;
  }
}

async function reconcileAction(body: any, admin: any) {
  const seriesId = String(body.seriesId || "");
  if (!seriesId) throw new Error("seriesId is required.");

  const { data: series, error } = await admin.from("aeos_session_series").select("*").eq("series_id", seriesId).single();
  if (error || !series) throw new Error("Recurring Session Series not found.");

  const reconciliation = await reconcileSeries(admin, series);
  return { ok: true, action: "reconcile_series", seriesId, reconciliation };
}

async function syncSeriesMetadataAction(body: any, admin: any) {
  const seriesId = String(body.seriesId || "").trim();
  if (!seriesId) throw new Error("seriesId is required.");

  const { data: series, error: seriesError } = await admin
    .from("aeos_session_series")
    .select(`
      series_id,
      student_id,
      student_user_id,
      offering_id,
      google_calendar_id,
      google_recurring_event_id
    `)
    .eq("series_id", seriesId)
    .single();

  if (seriesError || !series) {
    throw new Error("Recurring Session Series not found.");
  }

  if (!series.google_recurring_event_id) {
    throw new Error("Series is not linked to Google Calendar.");
  }

  let student: any = null;

  // Canonical identity first.
  if (series.student_id) {
    const { data, error } = await admin
      .from("aeos_students")
      .select(`
        student_id,
        portal_user_id,
        first_name,
        last_name,
        display_name,
        email
      `)
      .eq("student_id", series.student_id)
      .single();

    if (error) throw error;
    student = data;
  }

  // Legacy fallback.
  if (!student && series.student_user_id) {
    const { data, error } = await admin
      .from("aeos_students")
      .select(`
        student_id,
        portal_user_id,
        first_name,
        last_name,
        display_name,
        email
      `)
      .eq("portal_user_id", series.student_user_id)
      .maybeSingle();

    if (error) throw error;
    student = data;
  }

  if (!student) {
    throw new Error("AEOS Student not found.");
  }

  const { data: offering, error: offeringError } = await admin
    .from("aeos_offerings")
    .select("offering_name")
    .eq("offering_id", series.offering_id)
    .single();

  if (offeringError || !offering) {
    throw new Error("Offering not found.");
  }

  const fallbackName =
    String(student.email || "").trim() ||
    "Student";

  const studentName = displayStudentName(
    student,
    fallbackName
  );

  const resolvedTitle =
    `${studentName} — ${offering.offering_name}`;

  const calendarId =
    series.google_calendar_id ||
    env("GOOGLE_CALENDAR_ID", false) ||
    "primary";

  try {
    /*
     * PATCH ONLY THE MASTER EVENT SUMMARY.
     *
     * No start/end
     * No recurrence
     * No attendees
     * No conferenceData
     * No description
     */
    const query = new URLSearchParams({
      sendUpdates: "none",
    });

    const googleEvent = await googleRequest(
      await googleAccessToken(),
      `${calendarUrl(
        calendarId,
        `/${encodeURIComponent(
          series.google_recurring_event_id
        )}`
      )}?${query}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          summary: resolvedTitle,
        }),
      }
    );

    const now = new Date().toISOString();

    const { error: seriesUpdateError } = await admin
      .from("aeos_session_series")
      .update({
        series_title: resolvedTitle,
        google_sync_status: "synced",
        google_synced_at: now,
        google_sync_error: null,
      })
      .eq("series_id", seriesId);

    if (seriesUpdateError) {
      throw seriesUpdateError;
    }

    const { error: sessionsUpdateError } = await admin
      .from("aeos_sessions")
      .update({
        session_title: resolvedTitle,
      })
      .eq("series_id", seriesId);

    if (sessionsUpdateError) {
      throw sessionsUpdateError;
    }

    return {
      ok: true,
      action: "sync_series_metadata",
      seriesId,
      title: resolvedTitle,
      recurringEventId: googleEvent.id,
      calendarLink: googleEvent.htmlLink || null,
    };
  } catch (error) {
    await admin
      .from("aeos_session_series")
      .update({
        google_sync_status: "failed",
        google_sync_error:
          error instanceof Error
            ? error.message
            : String(error),
      })
      .eq("series_id", seriesId);

    throw error;
  }
}

async function deleteFutureSeriesAction(
  body: any,
  caller: any,
  admin: any
) {
  const seriesId = String(body.seriesId || "").trim();

  if (!seriesId) {
    throw new Error("seriesId is required.");
  }

  const { data: series, error: seriesError } = await admin
    .from("aeos_session_series")
    .select(`
      series_id,
      tutor_user_id,
      created_by,
      starts_at,
      google_calendar_id,
      google_recurring_event_id
    `)
    .eq("series_id", seriesId)
    .single();

  if (seriesError || !series) {
    throw new Error("Recurring Session Series not found.");
  }

  if (
    series.tutor_user_id !== caller.id &&
    series.created_by !== caller.id
  ) {
    throw new Error(
      "You are not permitted to delete this recurring Session Series."
    );
  }

  const now = new Date();

  if (
    !series.starts_at ||
    new Date(series.starts_at).getTime() <= now.getTime()
  ) {
    throw new Error(
      "This recurring Session Series has already started and cannot be deleted."
    );
  }

  const { data: sessions, error: sessionsError } = await admin
    .from("aeos_sessions")
    .select(`
      session_id,
      scheduled_start_at,
      session_status
    `)
    .eq("series_id", seriesId);

  if (sessionsError) {
    throw sessionsError;
  }

  const children = sessions ?? [];

  const hasStartedSession = children.some(
    (session: any) =>
      !session.scheduled_start_at ||
      new Date(session.scheduled_start_at).getTime() <= now.getTime()
  );

  if (hasStartedSession) {
    throw new Error(
      "This recurring Session Series contains a Session that has already started and cannot be deleted."
    );
  }

  const hasNonScheduledSession = children.some(
    (session: any) =>
      session.session_status !== "scheduled"
  );

  if (hasNonScheduledSession) {
    throw new Error(
      "This recurring Session Series contains Session activity and cannot be deleted."
    );
  }

  const calendarId =
    series.google_calendar_id ||
    env("GOOGLE_CALENDAR_ID", false) ||
    "primary";

  /*
   * Delete the Google recurring master first.
   *
   * This v1 action is permitted only when the entire
   * series is still in the future, so no historical
   * Google occurrences are being removed.
   */
  if (series.google_recurring_event_id) {
    try {
      const query = new URLSearchParams({
        sendUpdates: "all",
      });

      await googleRequest(
        await googleAccessToken(),
        `${calendarUrl(
          calendarId,
          `/${encodeURIComponent(
            series.google_recurring_event_id
          )}`
        )}?${query}`,
        {
          method: "DELETE",
        }
      );
    } catch (error) {
      await admin
        .from("aeos_session_series")
        .update({
          google_sync_status: "failed",
          google_sync_error:
            error instanceof Error
              ? error.message
              : String(error),
        })
        .eq("series_id", seriesId);

      throw error;
    }
  }

  const { error: sessionsDeleteError } = await admin
    .from("aeos_sessions")
    .delete()
    .eq("series_id", seriesId);

  if (sessionsDeleteError) {
    throw sessionsDeleteError;
  }

  const { error: seriesDeleteError } = await admin
    .from("aeos_session_series")
    .delete()
    .eq("series_id", seriesId);

  if (seriesDeleteError) {
    throw seriesDeleteError;
  }

  return {
    ok: true,
    action: "delete_future_series",
    seriesId,
    deletedSessions: children.length,
    calendarDeleted: Boolean(
      series.google_recurring_event_id
    ),
  };
}

async function stopFutureSeriesAction(
  body: any,
  caller: any,
  admin: any
) {
  const seriesId =
    String(body.seriesId || "").trim();

  if (!seriesId) {
    throw new Error(
      "seriesId is required."
    );
  }

  const {
    data: series,
    error: seriesError,
  } = await admin
    .from("aeos_session_series")
    .select(`
      series_id,
      tutor_user_id,
      created_by,
      starts_at,
      recurrence_lines,
      google_calendar_id,
      google_recurring_event_id
    `)
    .eq("series_id", seriesId)
    .single();

  if (
    seriesError ||
    !series
  ) {
    throw new Error(
      "Recurring Session Series not found."
    );
  }

  if (
    series.tutor_user_id !== caller.id &&
    series.created_by !== caller.id
  ) {
    throw new Error(
      "You are not permitted to stop this recurring Session Series."
    );
  }

  const now =
    new Date();

  if (
    !series.starts_at ||
    new Date(
      series.starts_at
    ).getTime() >
      now.getTime()
  ) {
    throw new Error(
      "This recurring Session Series has not started yet. Use delete_future_series instead."
    );
  }

  const {
    data: sessions,
    error: sessionsError,
  } = await admin
    .from("aeos_sessions")
    .select(`
      session_id,
      scheduled_start_at,
      session_status
    `)
    .eq(
      "series_id",
      seriesId
    )
    .order(
      "scheduled_start_at",
      {
        ascending: true,
      }
    );

  if (sessionsError) {
    throw sessionsError;
  }

  const children =
    sessions ?? [];

  const futureScheduled =
    children.filter(
      (session: any) =>
        session.session_status ===
          "scheduled" &&
        session.scheduled_start_at &&
        new Date(
          session.scheduled_start_at
        ).getTime() >
          now.getTime()
    );

  if (
    futureScheduled.length === 0
  ) {
    throw new Error(
      "This recurring Session Series has no future scheduled Sessions to stop."
    );
  }

  const firstFutureStart =
    new Date(
      futureScheduled[0]
        .scheduled_start_at
    );

  /*
   * End the Google recurrence one second
   * before the first remaining future
   * Session.
   */
  const recurrenceCutoff =
    new Date(
      firstFutureStart.getTime() -
        1000
    );

  const until =
    recurrenceCutoff
      .toISOString()
      .replace(
        /[-:]/g,
        ""
      )
      .replace(
        /\.\d{3}Z$/,
        "Z"
      );

  const originalLines =
    Array.isArray(
      series.recurrence_lines
    )
      ? series.recurrence_lines
      : [];

  const updatedLines =
    originalLines.map(
      (line: string) => {
        if (
          !line.startsWith(
            "RRULE:"
          )
        ) {
          return line;
        }

        const parts =
          line
            .split(";")
            .filter(
              (part) =>
                !part.startsWith(
                  "UNTIL="
                ) &&
                !part.startsWith(
                  "COUNT="
                )
            );

        return [
          ...parts,
          `UNTIL=${until}`,
        ].join(";");
      }
    );

  const updatedRrule =
    updatedLines.find(
      (line: string) =>
        line.startsWith("RRULE:")
    );

  if (!updatedRrule) {
    throw new Error(
      "Recurring Session Series has no valid RRULE and cannot be safely stopped."
    );
  }

  const calendarId =
    series.google_calendar_id ||
    env(
      "GOOGLE_CALENDAR_ID",
      false
    ) ||
    "primary";

  /*
   * Google first.
   *
   * If Google fails, AEOS remains unchanged.
   */
  if (
    series.google_recurring_event_id
  ) {
    try {
      const token =
        await googleAccessToken();

      const query =
        new URLSearchParams({
          sendUpdates:
            "all",
        });

      await googleRequest(
        token,
        `${calendarUrl(
          calendarId,
          `/${encodeURIComponent(
            series.google_recurring_event_id
          )}`
        )}?${query}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            recurrence:
              updatedLines,
          }),
        }
      );
    } catch (error) {
      await admin
        .from(
          "aeos_session_series"
        )
        .update({
          google_sync_status:
            "failed",
          google_sync_error:
            error instanceof Error
              ? error.message
              : String(error),
        })
        .eq(
          "series_id",
          seriesId
        );

      throw error;
    }
  }

  /*
   * Delete only untouched future
   * scheduled children.
   */
  const futureIds =
    futureScheduled.map(
      (session: any) =>
        session.session_id
    );

  const {
    error:
      sessionsDeleteError,
  } = await admin
    .from("aeos_sessions")
    .delete()
    .in(
      "session_id",
      futureIds
    );

  if (
    sessionsDeleteError
  ) {
    throw sessionsDeleteError;
  }

  const stoppedAt =
    new Date()
      .toISOString();

  const {
    error:
      seriesUpdateError,
  } = await admin
    .from(
      "aeos_session_series"
    )
    .update({
      recurrence_lines:
        updatedLines,
      series_status:
        "cancelled",
      google_sync_status:
        "cancelled",
      google_synced_at:
        stoppedAt,
      google_sync_error:
        null,
    })
    .eq(
      "series_id",
      seriesId
    );

  if (
    seriesUpdateError
  ) {
    throw seriesUpdateError;
  }

  return {
    ok: true,
    action:
      "stop_future_series",
    seriesId,
    removedFutureSessions:
      futureScheduled.length,
    preservedSessions:
      children.length -
      futureScheduled.length,
    stoppedAt,
    recurrenceUntil:
      until,
    calendarUpdated:
      Boolean(
        series.google_recurring_event_id
      ),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = env("SUPABASE_URL");
    const caller = await verifyAdminTutor(req, supabaseUrl);
    const admin = createClient(supabaseUrl, adminKey(), { auth: { autoRefreshToken: false, persistSession: false } });
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "create_series") {
  return json(
    await createSeries(body, caller, admin)
  );
}

if (action === "reconcile_series") {
  return json(
    await reconcileAction(body, admin)
  );
}

if (action === "sync_series_metadata") {
  return json(
    await syncSeriesMetadataAction(body, admin)
  );
}

if (action === "delete_future_series") {
  return json(
    await deleteFutureSeriesAction(
      body,
      caller,
      admin
    )
  );
}

if (
  action ===
  "stop_future_series"
) {
  return json(
    await stopFutureSeriesAction(
      body,
      caller,
      admin
    )
  );
}

return json(
  { ok: false, error: "Unknown action." },
  400
);
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
});
