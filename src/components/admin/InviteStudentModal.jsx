import { useState } from "react";
import { inviteStudent } from "../../lib/adminStudents";

const initialForm = {
  email: "",
  firstName: "",
  lastName: "",
  displayName: "",
  phone: "",
  dateOfBirth: "",
  school: "",
};

export default function InviteStudentModal({ open, onClose, onInvited }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const result = await inviteStudent({
        ...form,
        redirectTo: `${window.location.origin}/set-password`,
      });

      setSuccess(`Invitation sent to ${form.email}.`);
      setForm(initialForm);
      await onInvited?.(result);
    } catch (err) {
      setError(err.message || "Unable to invite student.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="aeos-modal-backdrop" role="presentation">
      <div
        className="aeos-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-student-title"
      >
        <div className="aeos-modal-header">
          <div>
            <p className="portal-eyebrow">AEOS Student Account</p>
            <h2 id="invite-student-title">Invite Student</h2>
          </div>
          <button type="button" className="aeos-icon-button" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="aeos-form">
          <div className="aeos-form-grid">
            <label>
              First name
              <input
                value={form.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                required
              />
            </label>

            <label>
              Last name
              <input
                value={form.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                required
              />
            </label>

            <label className="aeos-field-full">
              Display name
              <input
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                placeholder="Optional — defaults to first + last name"
              />
            </label>

            <label className="aeos-field-full">
              Email
              <input
                type="email"
                autoComplete="off"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                required
              />
            </label>

            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </label>

            <label>
              Date of birth
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
              />
            </label>

            <label className="aeos-field-full">
              School
              <input
                value={form.school}
                onChange={(e) => setField("school", e.target.value)}
              />
            </label>
          </div>

          {error ? <div className="portal-alert">{error}</div> : null}
          {success ? <div className="aeos-success">{success}</div> : null}

          <div className="aeos-modal-actions">
            <button
              type="button"
              className="aeos-button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="aeos-button-primary"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
