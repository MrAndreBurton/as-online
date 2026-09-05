import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

const json = (body: unknown, status=200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type":"application/json" } });

function reqEnv(name:string, required=true) {
  const v = Deno.env.get(name);
  if (required && !v) throw new Error(`Missing Edge Function secret: ${name}`);
  return v || "";
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

async function verifyAdminTutor(req:Request, url:string) {
  const authorization=req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) throw new Error("Authentication required.");

  const client=createClient(url,publishableKey(),{
    global:{headers:{Authorization:authorization}},
    auth:{autoRefreshToken:false,persistSession:false},
  });

  const {data:{user},error}=await client.auth.getUser();
  if (error || !user) throw new Error("Invalid AEOS session.");

  const {data:profile,error:profileError}=await client
    .from("profiles").select("id,app_role,is_active").eq("id",user.id).single();

  if (profileError || profile?.app_role!=="admin_tutor" || !profile?.is_active) {
    throw new Error("Admin/Tutor access required.");
  }
  return user;
}

async function googleAccessToken() {
  const params=new URLSearchParams({
    client_id:reqEnv("GOOGLE_CLIENT_ID"),
    client_secret:reqEnv("GOOGLE_CLIENT_SECRET"),
    refresh_token:reqEnv("GOOGLE_REFRESH_TOKEN"),
    grant_type:"refresh_token",
  });

  const r=await fetch(GOOGLE_TOKEN_URL,{
    method:"POST",
    headers:{"Content-Type":"application/x-www-form-urlencoded"},
    body:params
  });
  const body=await r.json();
  if (!r.ok || !body.access_token) throw new Error(`Google token refresh failed: ${body.error_description || body.error || r.status}`);
  return body.access_token as string;
}

async function googleFetch(token:string,url:string,init:RequestInit={}) {
  const r=await fetch(url,{
    ...init,
    headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json",...(init.headers||{})}
  });
  if (r.status===204) return null;
  const body=await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(`Google Calendar request failed: ${body?.error?.message || body?.error || r.status}`);
  return body;
}

const calUrl=(calendarId:string,eventId?:string)=>{
  const root=`${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`;
  return eventId?`${root}/${encodeURIComponent(eventId)}`:root;
};

function meetUrl(event:any) {
  return event?.hangoutLink ||
    event?.conferenceData?.entryPoints?.find((x:any)=>x.entryPointType==="video")?.uri ||
    null;
}

function conferenceStatus(event:any) {
  return event?.conferenceData?.createRequest?.status?.statusCode || (meetUrl(event)?"success":"unknown");
}

async function storeGoogle(admin:any,sessionId:string,calendarId:string,event:any) {
  const {error}=await admin.from("aeos_sessions").update({
    google_calendar_id:calendarId,
    google_calendar_event_id:event.id,
    google_event_html_link:event.htmlLink || null,
    google_meet_url:meetUrl(event),
    google_conference_status:conferenceStatus(event),
    google_sync_status:"synced",
    google_synced_at:new Date().toISOString(),
    google_sync_error:null,
  }).eq("session_id",sessionId);
  if (error) throw error;
  return {eventId:event.id,htmlLink:event.htmlLink||null,meetUrl:meetUrl(event),conferenceStatus:conferenceStatus(event)};
}

async function context(admin:any,sessionId:string) {
  const {data:session,error}=await admin
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
      calendar_timezone,
      google_calendar_id,
      google_calendar_event_id,
      offering:aeos_offerings(
        offering_name,
        subject:aeos_subjects(subject_name)
      )
    `)
    .eq("session_id",sessionId)
    .single();

  if (error || !session) {
    throw new Error("AEOS Session not found.");
  }

  let student:any = null;

  // Canonical AEOS student identity.
  if (session.student_id) {
    const {data,error:studentError}=await admin
      .from("aeos_students")
      .select(`
        student_id,
        portal_user_id,
        first_name,
        last_name,
        display_name,
        email
      `)
      .eq("student_id",session.student_id)
      .single();

    if (studentError) throw studentError;

    student=data;
  }

  // Legacy fallback for older portal-linked Sessions.
  if (!student && session.student_user_id) {
    const {data,error:studentError}=await admin
      .from("aeos_students")
      .select(`
        student_id,
        portal_user_id,
        first_name,
        last_name,
        display_name,
        email
      `)
      .eq("portal_user_id",session.student_user_id)
      .maybeSingle();

    if (studentError) throw studentError;

    student=data;
  }

  let studentEmail=
    String(student?.email || "").trim();

  // Final compatibility fallback for historical portal-only rows.
  if (!studentEmail && session.student_user_id) {
    const {data:profile,error:profileError}=await admin
      .from("profiles")
      .select("email,is_active")
      .eq("id",session.student_user_id)
      .maybeSingle();

    if (profileError) throw profileError;

    studentEmail=
      String(profile?.email || "").trim();
  }

  if (!studentEmail) {
    throw new Error("Student email unavailable.");
  }

  const studentName=
    String(student?.display_name || "").trim() ||
    [student?.first_name,student?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    studentEmail;

  return {
    session,
    student,
    studentEmail,
    studentName,
  };
}

async function createAction(body:any,caller:any,admin:any) {
  const requestedStudentId=
    String(body.studentId || "").trim();

  const requestedStudentUserId=
    String(body.studentUserId || "").trim();

  const incomingStudentEmail=
    String(body.studentEmail || "").trim();

  const offeringId=
    String(body.offeringId || "").trim();

  const startTime=
    String(body.startTime || "").trim();

  const endTime=
    String(body.endTime || "").trim();

  const requestedSessionTitle=
    String(body.sessionTitle || "").trim();

  const timezone=
    String(body.timezone || "").trim() ||
    reqEnv("GOOGLE_TIMEZONE",false) ||
    "America/Port_of_Spain";

  if (
    (!requestedStudentId && !requestedStudentUserId) ||
    !offeringId ||
    !startTime ||
    !endTime
  ) {
    throw new Error(
      "Student, Offering, start and end are required."
    );
  }

  if (new Date(endTime) <= new Date(startTime)) {
    throw new Error(
      "End time must be after start time."
    );
  }

  let student:any = null;

  /*
   * Canonical AEOS student identity first.
   */
  if (requestedStudentId) {
    const {data,error}=await admin
      .from("aeos_students")
      .select(`
        student_id,
        portal_user_id,
        first_name,
        last_name,
        display_name,
        email
      `)
      .eq("student_id",requestedStudentId)
      .single();

    if (error || !data) {
      throw new Error(
        "AEOS Student not found."
      );
    }

    student=data;
  }

  /*
   * Legacy portal identity fallback.
   */
  if (!student && requestedStudentUserId) {
    const {data,error}=await admin
      .from("aeos_students")
      .select(`
        student_id,
        portal_user_id,
        first_name,
        last_name,
        display_name,
        email
      `)
      .eq("portal_user_id",requestedStudentUserId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        "AEOS Student not found."
      );
    }

    student=data;
  }

  /*
   * If both identities were supplied, make sure
   * they refer to the same AEOS student.
   */
  if (
    requestedStudentUserId &&
    student.portal_user_id &&
    requestedStudentUserId !== student.portal_user_id
  ) {
    throw new Error(
      "Student identity mismatch."
    );
  }

  const studentId=
    String(student.student_id || "").trim();

  const studentUserId=
    student.portal_user_id
      ? String(student.portal_user_id).trim()
      : null;

  if (!studentId) {
    throw new Error(
      "Canonical AEOS student identity unavailable."
    );
  }

  /*
   * Validate enrolment using canonical student_id.
   */
  const {data:enrol,error:enrolError}=await admin
    .from("aeos_student_enrolments")
    .select("enrolment_id")
    .eq("student_id",studentId)
    .eq("offering_id",offeringId)
    .in("status",["active","paused"])
    .maybeSingle();

  if (enrolError) throw enrolError;

  if (!enrol) {
    throw new Error(
      "Student is not enrolled in this Offering."
    );
  }

  /*
   * Student email:
   * 1. canonical aeos_students
   * 2. incoming compatibility fallback
   * 3. historical profiles fallback if portal-linked
   */
  let studentEmail=
    String(student.email || "").trim() ||
    incomingStudentEmail;

  if (!studentEmail && studentUserId) {
    const {data:profile,error:profileError}=await admin
      .from("profiles")
      .select("email")
      .eq("id",studentUserId)
      .maybeSingle();

    if (profileError) throw profileError;

    studentEmail=
      String(profile?.email || "").trim();
  }

  if (!studentEmail) {
    throw new Error(
      "Student email unavailable."
    );
  }

  const studentName=
    String(student.display_name || "").trim() ||
    [student.first_name,student.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    studentEmail;

  const {data:offering,error:offeringError}=await admin
    .from("aeos_offerings")
    .select(`
      offering_name,
      subject:aeos_subjects(
        subject_name
      )
    `)
    .eq("offering_id",offeringId)
    .single();

  if (offeringError || !offering) {
    throw new Error(
      "Offering not found."
    );
  }

  /*
   * Same naming rule as recurring sessions.
   *
   * Custom title → preserve exactly.
   * Blank title  → Student Name — Offering.
   */
  const defaultSessionTitle=
    `${studentName} — ${offering.offering_name}`;

  const resolvedSessionTitle=
    requestedSessionTitle ||
    defaultSessionTitle;

  /*
   * Store canonical and optional portal identities.
   */
  const {data:session,error:sessionError}=await admin
    .from("aeos_sessions")
    .insert({
      student_id:studentId,
      student_user_id:studentUserId,
      tutor_user_id:caller.id,
      offering_id:offeringId,
      session_title:resolvedSessionTitle,
      session_status:"scheduled",
      scheduled_start_at:startTime,
      scheduled_end_at:endTime,
      calendar_timezone:timezone,
      google_sync_status:"pending",
      created_by:caller.id,
    })
    .select("session_id")
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const sessionId=
    session.session_id;

  const calendarId=
    reqEnv("GOOGLE_CALENDAR_ID",false) ||
    "primary";

  try {
    const token=
      await googleAccessToken();

    const event={
      summary:resolvedSessionTitle,

      description:[
        "A's Online tutoring session",
        `Student: ${studentName}`,
        `Offering: ${offering.offering_name}`,
        offering.subject?.subject_name
          ? `Subject: ${offering.subject.subject_name}`
          : null,
        `AEOS Session ID: ${sessionId}`,
      ]
        .filter(Boolean)
        .join("\n"),

      start:{
        dateTime:startTime,
        timeZone:timezone,
      },

      end:{
        dateTime:endTime,
        timeZone:timezone,
      },

      attendees:[
        {
          email:studentEmail,
        },
      ],

      conferenceData:{
        createRequest:{
          requestId:crypto.randomUUID(),
        },
      },

      extendedProperties:{
        private:{
          aeos_session_id:sessionId,
        },
      },
    };

    const query=
      new URLSearchParams({
        conferenceDataVersion:"1",
        sendUpdates:"all",
      });

    const googleEvent=
      await googleFetch(
        token,
        `${calUrl(calendarId)}?${query}`,
        {
          method:"POST",
          body:JSON.stringify(event),
        }
      );

    return {
      ok:true,
      action:"create",
      sessionId,
      ...await storeGoogle(
        admin,
        sessionId,
        calendarId,
        googleEvent
      ),
    };
  } catch (error) {
    await admin
      .from("aeos_sessions")
      .update({
        google_sync_status:"failed",
        google_sync_error:
          error instanceof Error
            ? error.message
            : String(error),
      })
      .eq("session_id",sessionId);

    throw error;
  }
}

async function syncAction(body:any,admin:any) {
  const sessionId=String(body.sessionId||"");
  const {session}=await context(admin,sessionId);
  if (!session.google_calendar_event_id) throw new Error("Session is not linked to Google Calendar.");
  const calendarId=session.google_calendar_id||"primary";
  const event=await googleFetch(await googleAccessToken(),calUrl(calendarId,session.google_calendar_event_id));
  return {ok:true,action:"sync",sessionId,...await storeGoogle(admin,sessionId,calendarId,event)};
}

async function updateAction(body:any,admin:any) {
  const sessionId=
    String(body.sessionId || "").trim();

  const {
    session,
    studentEmail,
    studentName,
  } = await context(admin, sessionId);

  const requestedOfferingId =
    body.offeringId !== undefined
      ? String(body.offeringId || "").trim()
      : "";

  let offeringId =
    session.offering_id;

  let offering =
    session.offering;

  const offeringChanged =
    Boolean(requestedOfferingId) &&
    requestedOfferingId !== session.offering_id;

  /*
   * Optional offering reassignment.
   *
   * Session Workspace reassignment is restricted
   * to ACTIVE enrolments.
   */
  if (offeringChanged) {
    const {
      data: enrolment,
      error: enrolmentError,
    } = await admin
      .from("aeos_student_enrolments")
      .select("enrolment_id")
      .eq("student_id", session.student_id)
      .eq("offering_id", requestedOfferingId)
      .eq("status", "active")
      .maybeSingle();

    if (enrolmentError) {
      throw enrolmentError;
    }

    if (!enrolment) {
      throw new Error(
        "Student is not actively enrolled in this Offering."
      );
    }

    const {
      data: nextOffering,
      error: offeringError,
    } = await admin
      .from("aeos_offerings")
      .select(`
        offering_id,
        offering_name,
        subject:aeos_subjects(
          subject_name
        )
      `)
      .eq("offering_id", requestedOfferingId)
      .single();

    if (offeringError || !nextOffering) {
      throw new Error(
        "Offering not found."
      );
    }

    offeringId =
      requestedOfferingId;

    offering =
      nextOffering;
  }

  const startTime =
    String(
      body.startTime ||
      session.scheduled_start_at
    );

  const endTime =
    String(
      body.endTime ||
      session.scheduled_end_at
    );

  const timezone =
    String(
      body.timezone ||
      session.calendar_timezone ||
      "America/Port_of_Spain"
    );

  if (new Date(endTime) <= new Date(startTime)) {
    throw new Error(
      "End time must be after start time."
    );
  }

  /*
   * Naming reconciliation.
   */
  const oldDefaultSessionTitle =
    `${studentName} — ${session.offering?.offering_name}`;

  const newDefaultSessionTitle =
    `${studentName} — ${offering?.offering_name}`;

  const existingTitle =
    String(session.session_title || "").trim();

  const suppliedTitle =
    body.sessionTitle !== undefined
      ? String(body.sessionTitle || "").trim()
      : null;

  let sessionTitle;

  if (body.sessionTitle !== undefined) {
    /*
     * Explicit blank → canonical default.
     *
     * If the form sends the old canonical title while
     * changing the Offering, reconcile it automatically
     * to the new canonical title.
     *
     * Otherwise preserve the supplied custom title.
     */
    if (!suppliedTitle) {
      sessionTitle =
        newDefaultSessionTitle;
    } else if (
      offeringChanged &&
      suppliedTitle === oldDefaultSessionTitle
    ) {
      sessionTitle =
        newDefaultSessionTitle;
    } else {
      sessionTitle =
        suppliedTitle;
    }
  } else if (
    offeringChanged &&
    (
      !existingTitle ||
      existingTitle === oldDefaultSessionTitle
    )
  ) {
    sessionTitle =
      newDefaultSessionTitle;
  } else {
    sessionTitle =
      existingTitle ||
      newDefaultSessionTitle;
  }

  /*
   * Update this AEOS Session only.
   *
   * Nothing here modifies aeos_session_series,
   * so a recurring-series parent is left untouched.
   */
  const sessionPatch:any = {
    offering_id: offeringId,
    session_title: sessionTitle,
    scheduled_start_at: startTime,
    scheduled_end_at: endTime,
    calendar_timezone: timezone,
  };

  if (session.google_calendar_event_id) {
    sessionPatch.google_sync_status =
      "pending";
  }

  const {
    error: sessionUpdateError,
  } = await admin
    .from("aeos_sessions")
    .update(sessionPatch)
    .eq("session_id", sessionId);

  if (sessionUpdateError) {
    throw sessionUpdateError;
  }

  /*
   * No Google-linked event:
   * the AEOS reassignment is complete.
   */
  if (!session.google_calendar_event_id) {
    return {
      ok: true,
      action: "update",
      sessionId,
      offeringId,
      sessionTitle,
      calendarUpdated: false,
    };
  }

  try {
    const calendarId =
      session.google_calendar_id ||
      "primary";

    const query =
      new URLSearchParams({
        conferenceDataVersion: "1",
        sendUpdates: "all",
      });

    const googlePatch:any = {
      summary: sessionTitle,

      start: {
        dateTime: startTime,
        timeZone: timezone,
      },

      end: {
        dateTime: endTime,
        timeZone: timezone,
      },

      attendees: [
        {
          email: studentEmail,
        },
      ],
    };

    /*
     * If the Offering changed, reconcile the
     * AEOS-managed Calendar description as well.
     */
    if (offeringChanged) {
      googlePatch.description = [
        "A's Online tutoring session",
        `Student: ${studentName}`,
        `Offering: ${offering?.offering_name}`,
        offering?.subject?.subject_name
          ? `Subject: ${offering.subject.subject_name}`
          : null,
        `AEOS Session ID: ${sessionId}`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    const event =
      await googleFetch(
        await googleAccessToken(),
        `${calUrl(
          calendarId,
          session.google_calendar_event_id
        )}?${query}`,
        {
          method: "PATCH",
          body: JSON.stringify(
            googlePatch
          ),
        }
      );

    return {
      ok: true,
      action: "update",
      sessionId,
      offeringId,
      sessionTitle,
      calendarUpdated: true,

      ...await storeGoogle(
        admin,
        sessionId,
        calendarId,
        event
      ),
    };
  } catch (error) {
    await admin
      .from("aeos_sessions")
      .update({
        google_sync_status: "failed",
        google_sync_error:
          error instanceof Error
            ? error.message
            : String(error),
      })
      .eq("session_id", sessionId);

    throw error;
  }
}

async function cancelAction(body:any,admin:any) {
  const sessionId=String(body.sessionId||"");
  const {session}=await context(admin,sessionId);

  if (!session.google_calendar_event_id) {
    await admin.from("aeos_sessions").update({session_status:"cancelled",google_sync_status:"cancelled",google_synced_at:new Date().toISOString()}).eq("session_id",sessionId);
    return {ok:true,action:"cancel",sessionId,calendarDeleted:false};
  }

  await admin.from("aeos_sessions").update({google_sync_status:"cancel_pending"}).eq("session_id",sessionId);

  try {
    const calendarId=session.google_calendar_id||"primary";
    const q=new URLSearchParams({sendUpdates:"all"});
    await googleFetch(await googleAccessToken(),`${calUrl(calendarId,session.google_calendar_event_id)}?${q}`,{method:"DELETE"});
    await admin.from("aeos_sessions").update({
      session_status:"cancelled",google_sync_status:"cancelled",
      google_synced_at:new Date().toISOString(),google_sync_error:null
    }).eq("session_id",sessionId);
    return {ok:true,action:"cancel",sessionId,calendarDeleted:true};
  } catch (error) {
    await admin.from("aeos_sessions").update({
      google_sync_status:"failed",
      google_sync_error:error instanceof Error?error.message:String(error),
    }).eq("session_id",sessionId);
    throw error;
  }
}

Deno.serve(async (req)=>{
  if (req.method==="OPTIONS") return new Response("ok",{status:200,headers:corsHeaders});
  if (req.method!=="POST") return json({ok:false,error:"Method not allowed."},405);

  try {
    const url=reqEnv("SUPABASE_URL");
    const caller=await verifyAdminTutor(req,url);
    const admin=createClient(url,adminKey(),{auth:{autoRefreshToken:false,persistSession:false}});
    const body=await req.json();
    const action=String(body.action||"create");

    if (action==="create") return json(await createAction(body,caller,admin));
    if (action==="sync") return json(await syncAction(body,admin));
    if (action==="update") return json(await updateAction(body,admin));
    if (action==="cancel") return json(await cancelAction(body,admin));
    return json({ok:false,error:"Unknown action."},400);
  } catch (error) {
    console.error(error);
    return json({ok:false,error:error instanceof Error?error.message:String(error)},400);
  }
});
