import { useMemo, useState } from "react";
import {
  enrolStudent,
  updateEnrolmentStatus,
} from "../../lib/adminStudents";
import { useAuth } from "../../contexts/AuthContext";

export default function EnrolmentControls({
  studentId,
  studentUserId = null,
  enrolments = [],
  offerings = [],
  onChanged,
}) {
  const { user } = useAuth();

  const [offeringId, setOfferingId] =
    useState("");

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const liveOfferingIds = useMemo(
    () =>
      new Set(
        enrolments
          .filter((item) =>
            ["active", "paused"].includes(
              item.status
            )
          )
          .map(
            (item) =>
              item.offering_id
          )
      ),
    [enrolments]
  );

  const availableOfferings =
    offerings.filter(
      (item) =>
        !liveOfferingIds.has(
          item.offering_id
        )
    );

  async function addEnrolment() {
    if (
      !studentId ||
      !offeringId ||
      !user?.id
    ) {
      return;
    }

    setWorking(true);
    setError("");

    try {
      await enrolStudent({
        studentId,

        // Optional.
        // Existing portal-linked students
        // still carry this during migration.
        studentUserId,

        offeringId,
        createdBy: user.id,
      });

      setOfferingId("");

      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function changeStatus(
    enrolmentId,
    status
  ) {
    setWorking(true);
    setError("");

    try {
      await updateEnrolmentStatus(
        enrolmentId,
        status
      );

      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="portal-card">
      <div className="aeos-section-heading">
        <div>
          <p className="portal-eyebrow">
            AEOS Offerings
          </p>

          <h3>Enrolments</h3>
        </div>
      </div>

      {enrolments.length ? (
        <div className="aeos-table-wrap">
          <table className="aeos-table">
            <thead>
              <tr>
                <th>Offering</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Change</th>
              </tr>
            </thead>

            <tbody>
              {enrolments.map(
                (item) => (
                  <tr
                    key={
                      item.enrolment_id
                    }
                  >
                    <td>
                      {item.offering
                        ?.offering_name ||
                        item.offering_id}
                    </td>

                    <td>
                      {item.offering
                        ?.subject
                        ?.subject_name ||
                        "—"}
                    </td>

                    <td>
                      <span className="status-pill">
                        {item.status}
                      </span>
                    </td>

                    <td>
                      <select
                        value={
                          item.status
                        }
                        disabled={
                          working
                        }
                        onChange={(
                          event
                        ) =>
                          changeStatus(
                            item.enrolment_id,
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="active">
                          Active
                        </option>

                        <option value="paused">
                          Paused
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="withdrawn">
                          Withdrawn
                        </option>
                      </select>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="aeos-empty-state">
          <h3>
            No Offering assigned
          </h3>

          <p>
            Assign an Offering below.
            Portal access is not
            required.
          </p>
        </div>
      )}

      <div className="aeos-inline-form">
        <select
          value={offeringId}
          onChange={(event) =>
            setOfferingId(
              event.target.value
            )
          }
          disabled={working}
        >
          <option value="">
            Choose an Offering
          </option>

          {availableOfferings.map(
            (item) => (
              <option
                key={
                  item.offering_id
                }
                value={
                  item.offering_id
                }
              >
                {
                  item.offering_name
                }
              </option>
            )
          )}
        </select>

        <button
          type="button"
          className="aeos-button-primary"
          disabled={
            !studentId ||
            !offeringId ||
            working
          }
          onClick={addEnrolment}
        >
          {working
            ? "Adding…"
            : "Add Offering"}
        </button>
      </div>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}
    </section>
  );
}

