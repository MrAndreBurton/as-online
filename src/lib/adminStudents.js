import { supabase } from "./supabase";

function fullName(row) {
  return (
    row?.display_name ||
    [row?.first_name, row?.last_name].filter(Boolean).join(" ") ||
    "Student"
  );
}

export async function fetchAdminStudents() {
  const [
    studentsResult,
    profilesResult,
    enrolmentsResult,
    offeringsResult,
    subjectsResult,
  ] = await Promise.all([
    supabase
      .from("student_profiles")
      .select(
        "user_id,first_name,last_name,display_name,phone,date_of_birth,school,created_at,updated_at"
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id,email,app_role,is_active,created_at")
      .eq("app_role", "student"),

    supabase
      .from("aeos_student_enrolments")
      .select(
        "enrolment_id,student_user_id,offering_id,status,enrolled_at,ended_at"
      )
      .in("status", ["active", "paused"]),

    supabase
      .from("aeos_offerings")
      .select("offering_id,offering_name,subject_id,audience_level_id,status"),

    supabase
      .from("aeos_subjects")
      .select("subject_id,subject_name,display_name"),
  ]);

  const results = [
    studentsResult,
    profilesResult,
    enrolmentsResult,
    offeringsResult,
    subjectsResult,
  ];
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const profilesById = new Map(
    (profilesResult.data ?? []).map((row) => [row.id, row])
  );
  const offeringsById = new Map(
    (offeringsResult.data ?? []).map((row) => [row.offering_id, row])
  );
  const subjectsById = new Map(
    (subjectsResult.data ?? []).map((row) => [row.subject_id, row])
  );

  const enrolmentsByStudent = new Map();
  for (const enrolment of enrolmentsResult.data ?? []) {
    if (!enrolmentsByStudent.has(enrolment.student_user_id)) {
      enrolmentsByStudent.set(enrolment.student_user_id, []);
    }

    const offering = offeringsById.get(enrolment.offering_id);
    enrolmentsByStudent.get(enrolment.student_user_id).push({
      ...enrolment,
      offering: offering
        ? {
            ...offering,
            subject: subjectsById.get(offering.subject_id) ?? null,
          }
        : null,
    });
  }

  return (studentsResult.data ?? []).map((student) => ({
    ...student,
    name: fullName(student),
    profile: profilesById.get(student.user_id) ?? null,
    enrolments: enrolmentsByStudent.get(student.user_id) ?? [],
  }));
}

export async function fetchAdminStudentById(studentUserId) {
  const [
    studentResult,
    profileResult,
    enrolmentsResult,
    offeringsResult,
    subjectsResult,
    sessionsResult,
  ] = await Promise.all([
    supabase
      .from("student_profiles")
      .select(
        "user_id,first_name,last_name,display_name,phone,date_of_birth,school,created_at,updated_at"
      )
      .eq("user_id", studentUserId)
      .single(),

    supabase
      .from("profiles")
      .select("id,email,app_role,is_active,created_at")
      .eq("id", studentUserId)
      .single(),

    supabase
      .from("aeos_student_enrolments")
      .select(
        "enrolment_id,student_user_id,offering_id,status,enrolled_at,ended_at"
      )
      .eq("student_user_id", studentUserId)
      .order("enrolled_at", { ascending: false }),

    supabase
      .from("aeos_offerings")
      .select(
        "offering_id,offering_name,programme_id,subject_id,audience_level_id,status"
      )
      .eq("status", "Active")
      .order("offering_name"),

    supabase
      .from("aeos_subjects")
      .select("subject_id,subject_name,display_name"),

    supabase
      .from("aeos_sessions")
      .select(
        "session_id,offering_id,session_title,session_status,scheduled_start_at,scheduled_end_at,started_at,ended_at,meeting_url"
      )
      .eq("student_user_id", studentUserId)
      .order("scheduled_start_at", { ascending: false })
      .limit(10),
  ]);

  const results = [
    studentResult,
    profileResult,
    enrolmentsResult,
    offeringsResult,
    subjectsResult,
    sessionsResult,
  ];
  const firstError = results.find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const subjectsById = new Map(
    (subjectsResult.data ?? []).map((row) => [row.subject_id, row])
  );
  const offerings = (offeringsResult.data ?? []).map((offering) => ({
    ...offering,
    subject: subjectsById.get(offering.subject_id) ?? null,
  }));
  const offeringsById = new Map(
    offerings.map((row) => [row.offering_id, row])
  );

  const enrolments = (enrolmentsResult.data ?? []).map((enrolment) => ({
    ...enrolment,
    offering: offeringsById.get(enrolment.offering_id) ?? null,
  }));

  const sessions = (sessionsResult.data ?? []).map((session) => ({
    ...session,
    offering: offeringsById.get(session.offering_id) ?? null,
  }));

  return {
    student: studentResult.data,
    profile: profileResult.data,
    enrolments,
    offerings,
    sessions,
  };
}

export async function updateStudentProfile(studentUserId, values) {
  const payload = {
    first_name: values.first_name?.trim() || null,
    last_name: values.last_name?.trim() || null,
    display_name: values.display_name?.trim() || null,
    phone: values.phone?.trim() || null,
    date_of_birth: values.date_of_birth || null,
    school: values.school?.trim() || null,
  };

  const { data, error } = await supabase
    .from("student_profiles")
    .update(payload)
    .eq("user_id", studentUserId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setStudentActive(studentUserId, isActive) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_active: Boolean(isActive) })
    .eq("id", studentUserId)
    .select("id,email,is_active")
    .single();

  if (error) throw error;
  return data;
}

export async function enrolStudent({
  studentUserId,
  offeringId,
  createdBy,
}) {
  const { data, error } = await supabase
    .from("aeos_student_enrolments")
    .insert({
      student_user_id: studentUserId,
      offering_id: offeringId,
      status: "active",
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateEnrolmentStatus(enrolmentId, status) {
  const payload = {
    status,
    ended_at:
      status === "completed" || status === "withdrawn"
        ? new Date().toISOString()
        : null,
  };

  const { data, error } = await supabase
    .from("aeos_student_enrolments")
    .update(payload)
    .eq("enrolment_id", enrolmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStudentSession({
  studentUserId,
  tutorUserId,
  offeringId,
  title,
  scheduledStartAt,
  scheduledEndAt,
  meetingUrl,
}) {
  const { data, error } = await supabase
    .from("aeos_sessions")
    .insert({
      student_user_id: studentUserId,
      tutor_user_id: tutorUserId,
      offering_id: offeringId,
      session_title: title?.trim() || null,
      session_status: "scheduled",
      scheduled_start_at: scheduledStartAt,
      scheduled_end_at: scheduledEndAt || null,
      meeting_url: meetingUrl?.trim() || null,
      created_by: tutorUserId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function inviteStudent(payload) {
  const { data, error } = await supabase.functions.invoke("invite-student", {
    body: payload,
  });

  if (error) throw error;
  if (!data?.ok) {
    throw new Error(data?.error || "Unable to invite student.");
  }

  return data;
}
