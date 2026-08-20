import { supabase } from "./supabase";

function fullName(row) {
  return (
    row?.display_name ||
    [row?.first_name, row?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "Student"
  );
}

/**
 * ============================================================
 * ADMIN STUDENT LIST
 * ============================================================
 *
 * Canonical source:
 *   aeos_students
 *
 * Portal/Auth profile is optional.
 */
export async function fetchAdminStudents() {
  const [
    studentsResult,
    profilesResult,
    enrolmentsResult,
    offeringsResult,
    subjectsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_students")
      .select(
        `
        student_id,
        portal_user_id,
        first_name,
        last_name,
        display_name,
        email,
        phone,
        date_of_birth,
        school,
        student_status,
        portal_status,
        notes,
        created_at,
        updated_at
        `
      )
      .neq("student_status", "archived")
      .order("created_at", {
        ascending: false,
      }),

    supabase
      .from("profiles")
      .select(
        "id,email,app_role,is_active,created_at"
      )
      .eq("app_role", "student"),

    supabase
      .from("aeos_student_enrolments")
      .select(
        `
        enrolment_id,
        student_id,
        student_user_id,
        offering_id,
        status,
        enrolled_at,
        ended_at
        `
      )
      .in("status", ["active", "paused"]),

    supabase
      .from("aeos_offerings")
      .select(
        `
        offering_id,
        offering_name,
        programme_id,
        subject_id,
        audience_level_id,
        status
        `
      ),

    supabase
      .from("aeos_subjects")
      .select(
        `
        subject_id,
        subject_name,
        display_name
        `
      ),
  ]);

  const results = [
    studentsResult,
    profilesResult,
    enrolmentsResult,
    offeringsResult,
    subjectsResult,
  ];

  const firstError =
    results.find(
      (result) => result.error
    )?.error;

  if (firstError) {
    throw firstError;
  }

  const students =
    studentsResult.data ?? [];

  const profiles =
    profilesResult.data ?? [];

  const enrolments =
    enrolmentsResult.data ?? [];

  const offerings =
    offeringsResult.data ?? [];

  const subjects =
    subjectsResult.data ?? [];

  const profilesById = new Map(
    profiles.map((row) => [
      row.id,
      row,
    ])
  );

  const offeringsById = new Map(
    offerings.map((row) => [
      row.offering_id,
      row,
    ])
  );

  const subjectsById = new Map(
    subjects.map((row) => [
      row.subject_id,
      row,
    ])
  );

  return students.map((student) => {
    const profile =
      student.portal_user_id
        ? profilesById.get(
            student.portal_user_id
          ) ?? null
        : null;

    const studentEnrolments =
      enrolments
        .filter((enrolment) => {
          if (
            enrolment.student_id ===
            student.student_id
          ) {
            return true;
          }

          if (
            student.portal_user_id &&
            enrolment.student_user_id ===
              student.portal_user_id
          ) {
            return true;
          }

          return false;
        })
        .map((enrolment) => {
          const offering =
            offeringsById.get(
              enrolment.offering_id
            ) ?? null;

          const subject = offering
            ? subjectsById.get(
                offering.subject_id
              ) ?? null
            : null;

          return {
            ...enrolment,

            offering: offering
              ? {
                  ...offering,
                  subject,
                }
              : null,
          };
        });

    return {
      ...student,

      name: fullName(student),

      profile,

      enrolments: studentEnrolments,

      // Temporary compatibility field
      // for older components.
      user_id:
        student.portal_user_id,
    };
  });
}

/**
 * ============================================================
 * SINGLE STUDENT PROFILE
 * ============================================================
 *
 * IMPORTANT:
 * studentId = aeos_students.student_id
 *
 * We do NOT assume a portal/Auth account exists.
 */
export async function fetchAdminStudentById(
  studentId
) {
  // ----------------------------------------
  // 1. Load canonical student first.
  // ----------------------------------------

  const {
    data: student,
    error: studentError,
  } = await supabase
    .from("aeos_students")
    .select(
      `
      student_id,
      portal_user_id,
      first_name,
      last_name,
      display_name,
      email,
      phone,
      date_of_birth,
      school,
      student_status,
      portal_status,
      notes,
      created_at,
      updated_at
      `
    )
    .eq("student_id", studentId)
    .single();

  if (studentError) {
    throw studentError;
  }

  if (!student) {
    throw new Error(
      "Student not found."
    );
  }

  const portalUserId =
    student.portal_user_id;

  // ----------------------------------------
  // 2. Load data that does NOT depend
  //    on portal access.
  // ----------------------------------------

  const [
    offeringsResult,
    subjectsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_offerings")
      .select(
        `
        offering_id,
        offering_name,
        programme_id,
        subject_id,
        audience_level_id,
        status
        `
      )
      .eq("status", "Active")
      .order("offering_name"),

    supabase
      .from("aeos_subjects")
      .select(
        `
        subject_id,
        subject_name,
        display_name
        `
      ),
  ]);

  if (offeringsResult.error) {
    throw offeringsResult.error;
  }

  if (subjectsResult.error) {
    throw subjectsResult.error;
  }

  // ----------------------------------------
  // 3. Enrolments
  //
  // New records use student_id.
  // Older records may still use
  // student_user_id.
  // ----------------------------------------

  let enrolmentsQuery = supabase
    .from("aeos_student_enrolments")
    .select(
      `
      enrolment_id,
      student_id,
      student_user_id,
      offering_id,
      status,
      enrolled_at,
      ended_at
      `
    );

  if (portalUserId) {
    enrolmentsQuery =
      enrolmentsQuery.or(
        `student_id.eq.${studentId},student_user_id.eq.${portalUserId}`
      );
  } else {
    enrolmentsQuery =
      enrolmentsQuery.eq(
        "student_id",
        studentId
      );
  }

  const enrolmentsResult =
    await enrolmentsQuery.order(
      "enrolled_at",
      {
        ascending: false,
      }
    );

  if (enrolmentsResult.error) {
    throw enrolmentsResult.error;
  }

  // ----------------------------------------
  // 4. Sessions
  //
  // Same compatibility strategy.
  // ----------------------------------------

  let sessionsQuery = supabase
    .from("aeos_sessions")
    .select(
      `
      session_id,
      student_id,
      student_user_id,
      offering_id,
      session_title,
      session_status,
      session_origin,
      attendance_status,
      attendance_notes,
      scheduled_start_at,
      scheduled_end_at,
      started_at,
      ended_at,
      meeting_url,
      google_meet_url,
      calendar_sync_requirement,
      google_sync_status
      `
    );

  if (portalUserId) {
    sessionsQuery =
      sessionsQuery.or(
        `student_id.eq.${studentId},student_user_id.eq.${portalUserId}`
      );
  } else {
    sessionsQuery =
      sessionsQuery.eq(
        "student_id",
        studentId
      );
  }

  const sessionsResult =
    await sessionsQuery
      .order("scheduled_start_at", {
        ascending: false,
      })
      .limit(20);

  if (sessionsResult.error) {
    throw sessionsResult.error;
  }

  // ----------------------------------------
  // 5. Portal/Auth profile is optional.
  // ----------------------------------------

  let profile = null;

  if (portalUserId) {
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        app_role,
        is_active,
        created_at
        `
      )
      .eq("id", portalUserId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    profile = profileData;
  }

  // ----------------------------------------
  // 6. Build Offering / Subject maps.
  // ----------------------------------------

  const subjectsById = new Map(
    (
      subjectsResult.data ?? []
    ).map((row) => [
      row.subject_id,
      row,
    ])
  );

  const offerings = (
    offeringsResult.data ?? []
  ).map((offering) => ({
    ...offering,

    subject:
      subjectsById.get(
        offering.subject_id
      ) ?? null,
  }));

  const offeringsById = new Map(
    offerings.map((row) => [
      row.offering_id,
      row,
    ])
  );

  // ----------------------------------------
  // 7. Enrolment enrichment.
  // ----------------------------------------

  const enrolments = (
    enrolmentsResult.data ?? []
  ).map((enrolment) => ({
    ...enrolment,

    offering:
      offeringsById.get(
        enrolment.offering_id
      ) ?? null,
  }));

  // ----------------------------------------
  // 8. Session enrichment.
  // ----------------------------------------

  const sessions = (
    sessionsResult.data ?? []
  ).map((session) => ({
    ...session,

    offering:
      offeringsById.get(
        session.offering_id
      ) ?? null,
  }));

  return {
    student: {
      ...student,
      name: fullName(student),
    },

    profile,

    enrolments,

    offerings,

    sessions,
  };
}

/**
 * ============================================================
 * UPDATE CANONICAL STUDENT
 * ============================================================
 */
export async function updateStudentProfile(
  studentId,
  values
) {
  const payload = {
    first_name:
      values.first_name?.trim() ||
      null,

    last_name:
      values.last_name?.trim() ||
      null,

    display_name:
      values.display_name?.trim() ||
      null,

    email:
      values.email?.trim() ||
      null,

    phone:
      values.phone?.trim() ||
      null,

    date_of_birth:
      values.date_of_birth ||
      null,

    school:
      values.school?.trim() ||
      null,

    notes:
      values.notes?.trim() ||
      null,
  };

  const {
    data: student,
    error,
  } = await supabase
    .from("aeos_students")
    .update(payload)
    .eq("student_id", studentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  /*
   * Temporary compatibility sync:
   *
   * If this student already has an old
   * student_profiles row, keep it in sync.
   *
   * This can be removed once every AEOS
   * subsystem uses aeos_students.
   */
  if (student.portal_user_id) {
    const legacyPayload = {
      first_name:
        payload.first_name,

      last_name:
        payload.last_name,

      display_name:
        payload.display_name,

      phone:
        payload.phone,

      date_of_birth:
        payload.date_of_birth,

      school:
        payload.school,
    };

    const {
      error: legacyError,
    } = await supabase
      .from("student_profiles")
      .update(legacyPayload)
      .eq(
        "user_id",
        student.portal_user_id
      );

    if (legacyError) {
      console.warn(
        "Canonical student updated, but legacy student_profiles sync failed:",
        legacyError
      );
    }
  }

  return student;
}

/**
 * ============================================================
 * ACTIVATE / DEACTIVATE STUDENT
 * ============================================================
 *
 * Canonical status is aeos_students.student_status.
 *
 * If a portal account exists, profiles.is_active
 * is synchronized too.
 */
export async function setStudentActive(
  studentId,
  isActive
) {
  const studentStatus =
    isActive
      ? "active"
      : "inactive";

  const {
    data: student,
    error,
  } = await supabase
    .from("aeos_students")
    .update({
      student_status:
        studentStatus,
    })
    .eq("student_id", studentId)
    .select(
      `
      student_id,
      portal_user_id,
      student_status,
      portal_status
      `
    )
    .single();

  if (error) {
    throw error;
  }

  if (student.portal_user_id) {
    const {
      error: profileError,
    } = await supabase
      .from("profiles")
      .update({
        is_active:
          Boolean(isActive),
      })
      .eq(
        "id",
        student.portal_user_id
      );

    if (profileError) {
      console.warn(
        "Student status updated, but portal profile status sync failed:",
        profileError
      );
    }
  }

  return student;
}

/**
 * ============================================================
 * ENROL STUDENT
 * ============================================================
 *
 * New canonical input:
 *   studentId
 *
 * studentUserId remains optional for
 * backwards compatibility.
 */
export async function enrolStudent({
  studentId,
  studentUserId = null,
  offeringId,
  createdBy,
}) {
  let canonicalStudentId =
    studentId;

  let portalUserId =
    studentUserId;

  /*
   * If only the old user ID was supplied,
   * resolve the canonical student.
   */
  if (
    !canonicalStudentId &&
    portalUserId
  ) {
    const {
      data: student,
      error,
    } = await supabase
      .from("aeos_students")
      .select(
        "student_id,portal_user_id"
      )
      .eq(
        "portal_user_id",
        portalUserId
      )
      .single();

    if (error) {
      throw error;
    }

    canonicalStudentId =
      student.student_id;
  }

  /*
   * If only canonical studentId was supplied,
   * obtain portal_user_id if one exists.
   */
  if (
    canonicalStudentId &&
    !portalUserId
  ) {
    const {
      data: student,
      error,
    } = await supabase
      .from("aeos_students")
      .select(
        "student_id,portal_user_id"
      )
      .eq(
        "student_id",
        canonicalStudentId
      )
      .single();

    if (error) {
      throw error;
    }

    portalUserId =
      student.portal_user_id;
  }

  if (!canonicalStudentId) {
    throw new Error(
      "Student ID is required."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("aeos_student_enrolments")
    .insert({
      student_id:
        canonicalStudentId,

      // May legitimately be null.
      student_user_id:
        portalUserId || null,

      offering_id:
        offeringId,

      status:
        "active",

      created_by:
        createdBy,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * ============================================================
 * UPDATE ENROLMENT STATUS
 * ============================================================
 */
export async function updateEnrolmentStatus(
  enrolmentId,
  status
) {
  const payload = {
    status,

    ended_at:
      status === "completed" ||
      status === "withdrawn"
        ? new Date().toISOString()
        : null,
  };

  const {
    data,
    error,
  } = await supabase
    .from("aeos_student_enrolments")
    .update(payload)
    .eq(
      "enrolment_id",
      enrolmentId
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * ============================================================
 * CREATE SESSION
 * ============================================================
 *
 * Supports both:
 * - canonical studentId
 * - legacy studentUserId
 *
 * Future scheduled Sessions may still use the
 * Google scheduling engine; this direct helper
 * remains useful for compatibility.
 */
export async function createStudentSession({
  studentId,
  studentUserId = null,
  tutorUserId,
  offeringId,
  title,
  scheduledStartAt,
  scheduledEndAt,
  meetingUrl,
}) {
  let canonicalStudentId =
    studentId;

  let portalUserId =
    studentUserId;

  if (
    !canonicalStudentId &&
    portalUserId
  ) {
    const {
      data: student,
      error,
    } = await supabase
      .from("aeos_students")
      .select(
        "student_id,portal_user_id"
      )
      .eq(
        "portal_user_id",
        portalUserId
      )
      .single();

    if (error) {
      throw error;
    }

    canonicalStudentId =
      student.student_id;
  }

  if (
    canonicalStudentId &&
    !portalUserId
  ) {
    const {
      data: student,
      error,
    } = await supabase
      .from("aeos_students")
      .select(
        "student_id,portal_user_id"
      )
      .eq(
        "student_id",
        canonicalStudentId
      )
      .single();

    if (error) {
      throw error;
    }

    portalUserId =
      student.portal_user_id;
  }

  if (!canonicalStudentId) {
    throw new Error(
      "Student ID is required."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("aeos_sessions")
    .insert({
      student_id:
        canonicalStudentId,

      // Can be null for non-portal students.
      student_user_id:
        portalUserId || null,

      tutor_user_id:
        tutorUserId,

      offering_id:
        offeringId,

      session_title:
        title?.trim() ||
        null,

      session_status:
        "scheduled",

      session_origin:
        "scheduled",

      attendance_status:
        "scheduled",

      scheduled_start_at:
        scheduledStartAt,

      scheduled_end_at:
        scheduledEndAt ||
        null,

      meeting_url:
        meetingUrl?.trim() ||
        null,

      calendar_sync_requirement:
        "required",

      created_by:
        tutorUserId,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * ============================================================
 * INVITE STUDENT
 * ============================================================
 *
 * IMPORTANT:
 * This is still the OLD invite Edge Function contract.
 *
 * We are keeping it working for existing portal students.
 *
 * The next upgrade should let us:
 *
 * existing aeos_student
 * → create Auth account
 * → link portal_user_id
 *
 * instead of creating a second student record.
 */
export async function inviteStudent(
  payload
) {
  const {
    data,
    error,
  } =
    await supabase.functions.invoke(
      "invite-student",
      {
        body: payload,
      }
    );

  if (error) {
    throw error;
  }

  if (!data?.ok) {
    throw new Error(
      data?.error ||
        "Unable to invite student."
    );
  }

  return data;
}

export async function inviteExistingStudentToPortal(studentId) {
  const { data, error } = await supabase.functions.invoke(
    "invite-existing-student",
    {
      body: {
        studentId,
      },
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.ok) {
    throw new Error(
      data?.error ||
        "Unable to invite student to portal."
    );
  }

  return data;
}
