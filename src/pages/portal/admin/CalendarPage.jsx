import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  fetchCalendarSessions,
} from "../../../lib/studentOperations";

import {
  deleteFutureSeries,
  stopFutureSeries,
} from "../../../lib/recurringCalendar";

import "../../../styles/studentOperations.css";
import "../../../styles/calendarIntegration.css";

const studentName = (student) =>
  student?.display_name ||
  [
    student?.first_name,
    student?.last_name,
  ]
    .filter(Boolean)
    .join(" ") ||
  "Student";

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  d.setDate(
    d.getDate() + diff
  );

  d.setHours(
    0,
    0,
    0,
    0
  );

  return d;
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatWeekRange(start, end) {
  const finalDay =
    new Date(
      end.getTime() - 1
    );

  const sameYear =
    start.getFullYear() ===
    finalDay.getFullYear();

  const sameMonth =
    sameYear &&
    start.getMonth() ===
      finalDay.getMonth();

  if (sameMonth) {
    return `${start.toLocaleDateString(
      [],
      {
        month: "long",
        day: "numeric",
      }
    )}–${finalDay.toLocaleDateString(
      [],
      {
        day: "numeric",
        year: "numeric",
      }
    )}`;
  }

  if (sameYear) {
    return `${start.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
      }
    )} – ${finalDay.toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    )}`;
  }

  return `${start.toLocaleDateString()} – ${finalDay.toLocaleDateString()}`;
}

export default function CalendarPage() {
  const [anchor, setAnchor] =
    useState(() => new Date());

  const [sessions, setSessions] =
    useState([]);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    deletingSeriesId,
    setDeletingSeriesId,
  ] = useState(null);

  const range = useMemo(() => {
    const start =
      startOfWeek(anchor);

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 7
    );

    return {
      start,
      end,
    };
  }, [anchor]);

  const days = useMemo(() => {
    return Array.from(
      {
        length: 7,
      },
      (_, index) => {
        const date =
          new Date(range.start);

        date.setDate(
          date.getDate() +
            index
        );

        return date;
      }
    );
  }, [range]);

  const sessionsByDay =
    useMemo(() => {
      const map =
        new Map();

      days.forEach((day) => {
        const key =
          day.toDateString();

        map.set(
          key,
          []
        );
      });

      sessions.forEach(
        (session) => {
          const start =
            new Date(
              session.scheduled_start_at
            );

          const key =
            start.toDateString();

          if (!map.has(key)) {
            map.set(
              key,
              []
            );
          }

          map
            .get(key)
            .push(session);
        }
      );

      return map;
    }, [days, sessions]);

  /*
   * Only the first visible occurrence of a
   * recurring series receives its lifecycle
   * action.
   *
   * This remains presentation logic only.
   * The Edge Function is authoritative.
   */
  const firstVisibleSessionBySeries =
    useMemo(() => {
      const map =
        new Map();

      sessions.forEach(
        (session) => {
          if (
            session.series_id &&
            !map.has(
              session.series_id
            )
          ) {
            map.set(
              session.series_id,
              session.session_id
            );
          }
        }
      );

      return map;
    }, [sessions]);

  useEffect(() => {
    let active = true;

    setError("");

    fetchCalendarSessions(
      range.start.toISOString(),
      range.end.toISOString()
    )
      .then((data) => {
        if (active) {
          setSessions(data);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.message ||
              "Unable to load Calendar."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [range]);

  async function refreshCalendar() {
    const data =
      await fetchCalendarSessions(
        range.start.toISOString(),
        range.end.toISOString()
      );

    setSessions(data);
  }

  function moveWeek(number) {
    setAnchor((current) => {
      const d =
        new Date(current);

      d.setDate(
        d.getDate() +
          number * 7
      );

      return d;
    });
  }

  async function handleSeriesLifecycleAction(
    session
  ) {
    if (!session.series_id) {
      return;
    }

    const seriesStarted =
      Boolean(
        session.series?.starts_at
      ) &&
      new Date(
        session.series.starts_at
      ).getTime() <= Date.now();

    const confirmed =
      window.confirm(
        seriesStarted
          ? "Stop all future Sessions in this recurring series?\n\n" +
              "Past and completed Sessions will be preserved. Only future scheduled Sessions will be removed, and the Google Calendar recurrence will be stopped."
          : "Delete this entire recurring series?\n\n" +
              "This will remove all Sessions in the series and its Google Calendar recurring event.\n\n" +
              "AEOS will refuse the deletion if the series has already started, if any Session has already started, or if any Session is no longer scheduled."
      );

    if (!confirmed) {
      return;
    }

    setDeletingSeriesId(
      session.series_id
    );

    setError("");
    setSuccess("");

    try {
      const result =
        seriesStarted
          ? await stopFutureSeries(
              session.series_id
            )
          : await deleteFutureSeries(
              session.series_id
            );

      await refreshCalendar();

      if (seriesStarted) {
        const removedCount =
          result?.removedFutureSessions;

        setSuccess(
          removedCount !==
            undefined
            ? `Recurring series stopped. ${removedCount} future Session${
                removedCount === 1
                  ? ""
                  : "s"
              } removed. Historical Sessions were preserved.`
            : "Recurring series stopped. Historical Sessions were preserved."
        );
      } else {
        const deletedCount =
          result?.deletedSessions;

        setSuccess(
          deletedCount !==
            undefined
            ? `Recurring series deleted. ${deletedCount} Session${
                deletedCount === 1
                  ? ""
                  : "s"
              } removed.`
            : "Recurring series deleted."
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to update recurring series."
      );
    } finally {
      setDeletingSeriesId(
        null
      );
    }
  }

  const today =
    new Date();

  const weekLabel =
    formatWeekRange(
      range.start,
      range.end
    );

  return (
    <>
      <section className="aeos-page-heading calendar-page-heading">
        <div>
          <p className="portal-eyebrow">
            Operations
          </p>

          <h2>
            Calendar
          </h2>

          <div className="calendar-current-range">
            {weekLabel}
          </div>

          <p>
            View and manage your
            teaching schedule for the
            week.
          </p>
        </div>

        <div className="calendar-heading-summary">
          <div className="calendar-session-count">
            <strong>
              {sessions.length}
            </strong>

            <span>
              {sessions.length === 1
                ? "session"
                : "sessions"}
            </span>
          </div>

          <div className="calendar-heading-actions">
            <button
              type="button"
              className="aeos-button-secondary"
              onClick={() =>
                moveWeek(-1)
              }
            >
              ← Previous
            </button>

            <button
              type="button"
              className="aeos-button-secondary"
              onClick={() =>
                setAnchor(
                  new Date()
                )
              }
            >
              This Week
            </button>

            <button
              type="button"
              className="aeos-button-secondary"
              onClick={() =>
                moveWeek(1)
              }
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="calendar-delete-success">
          {success}
        </div>
      ) : null}

      <section className="calendar-week-agenda">
        {days.map((day) => {
          const key =
            day.toDateString();

          const daySessions =
            sessionsByDay.get(
              key
            ) ?? [];

          const isToday =
            isSameCalendarDay(
              day,
              today
            );

          return (
            <section
              key={key}
              className={`calendar-day-group${
                isToday
                  ? " calendar-day-group-today"
                  : ""
              }`}
            >
              <div className="calendar-day-heading">
                <div className="calendar-day-date-block">
                  <span className="calendar-day-name">
                    {day
                      .toLocaleDateString(
                        [],
                        {
                          weekday:
                            "long",
                        }
                      )
                      .toUpperCase()}
                  </span>

                  <div className="calendar-day-date-line">
                    <strong>
                      {day.toLocaleDateString(
                        [],
                        {
                          month:
                            "short",
                          day: "numeric",
                        }
                      )}
                    </strong>

                    {isToday ? (
                      <span className="calendar-today-badge">
                        Today
                      </span>
                    ) : null}
                  </div>
                </div>

                <span className="calendar-day-count">
                  {daySessions.length ===
                  1
                    ? "1 session"
                    : `${daySessions.length} sessions`}
                </span>
              </div>

              {daySessions.length ? (
                <div className="calendar-day-sessions">
                  {daySessions.map(
                    (session) => {
                      const seriesStarted =
                        Boolean(
                          session
                            .series
                            ?.starts_at
                        ) &&
                        new Date(
                          session.series.starts_at
                        ).getTime() <=
                          Date.now();

                      const seriesActionable =
                        Boolean(
                          session.series_id
                        ) &&
                        [
                          "active",
                          "paused",
                        ].includes(
                          session
                            .series
                            ?.series_status
                        );

                      const showSeriesAction =
                        seriesActionable &&
                        firstVisibleSessionBySeries.get(
                          session.series_id
                        ) ===
                          session.session_id;

                      const deleting =
                        deletingSeriesId ===
                        session.series_id;

                      const startTime =
                        new Date(
                          session.scheduled_start_at
                        );

                      const endTime =
                        session.scheduled_end_at
                          ? new Date(
                              session.scheduled_end_at
                            )
                          : null;

                      return (
                        <div
                          key={
                            session.session_id
                          }
                          className="calendar-agenda-session"
                        >
                          <Link
                            to={`/portal/admin/sessions/${session.session_id}`}
                            className="calendar-agenda-session-link"
                          >
                            <div className="calendar-agenda-time">
                              <strong>
                                {startTime.toLocaleTimeString(
                                  [],
                                  {
                                    hour:
                                      "numeric",
                                    minute:
                                      "2-digit",
                                  }
                                )}
                              </strong>

                              {endTime ? (
                                <span>
                                  to{" "}
                                  {endTime.toLocaleTimeString(
                                    [],
                                    {
                                      hour:
                                        "numeric",
                                      minute:
                                        "2-digit",
                                    }
                                  )}
                                </span>
                              ) : null}
                            </div>

                            <div className="calendar-agenda-details">
                              <strong className="calendar-agenda-student">
                                {studentName(
                                  session.student
                                )}
                              </strong>

                              <span className="calendar-agenda-offering">
                                {session
                                  .offering
                                  ?.offering_name ||
                                  session.session_title ||
                                  "Teaching Session"}
                              </span>
                            </div>

                            <div className="calendar-agenda-meta">
                              <span className="status-pill">
                                {
                                  session.session_status
                                }
                              </span>

                              <span>
                                {session.series_id
                                  ? "Recurring"
                                  : session.session_origin}
                              </span>
                            </div>
                          </Link>

                          {showSeriesAction ? (
                            <div className="calendar-session-actions">
                              <button
                                type="button"
                                className="calendar-danger-button"
                                disabled={
                                  Boolean(
                                    deletingSeriesId
                                  )
                                }
                                onClick={() =>
                                  handleSeriesLifecycleAction(
                                    session
                                  )
                                }
                              >
                                {deleting
                                  ? seriesStarted
                                    ? "Stopping…"
                                    : "Deleting…"
                                  : seriesStarted
                                    ? "Stop Future Sessions"
                                    : "Delete Series"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="calendar-day-empty">
                  No sessions scheduled
                </div>
              )}
            </section>
          );
        })}
      </section>
    </>
  );
}


