import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo/as-online-logo.svg";

export default function SetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setWorking(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      const {
        data: activationData,
        error: activationError,
      } = await supabase.functions.invoke(
        "complete-student-portal-setup",
        {
          body: {},
        }
      );

      if (activationError) {
        throw activationError;
      }

      if (!activationData?.ok) {
        throw new Error(
          activationData?.error ||
            "Unable to activate your Student Portal."
        );
      }

      navigate("/portal", {
        replace: true,
      });
    } catch (err) {
      console.error("Student portal setup failed:", err);

      setError(
        err?.message ||
          "Unable to complete your account setup. Please reopen the invitation link."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="portal-login-page">
      <section className="portal-login-brand">
        <div className="portal-login-brand-content">
          <a
  className="portal-login-brand-link"
  href="/"
>
  <img
    className="portal-login-logo"
    src={logo}
    alt="A's Online"
  />

  <div>
    <p className="portal-login-brand-name">
      A's Online
    </p>

    <p className="portal-login-brand-subtitle">
      Student Portal
    </p>
  </div>
</a>

          <div className="portal-login-intro">
            <p className="portal-login-kicker">
              One final step
            </p>

            <h1>
              Your learning space is almost ready.
            </h1>

            <p className="portal-login-description">
              Create your password to complete your account and access
              your sessions, homework, progress and learning resources.
            </p>
          </div>

          <div className="portal-login-access-note">
            <span className="portal-login-access-dot" />

            Secure student access powered by AEOS
          </div>
        </div>
      </section>

      <main className="portal-login-panel">
        <div className="portal-login-form-shell">
          <header className="portal-login-form-header">
            <p className="portal-eyebrow">
              Account setup
            </p>

            <h2>Create your password</h2>

            <p>
              Choose a password with at least 8 characters to complete
              your A's Online Student Portal account.
            </p>
          </header>

          <div className="portal-recovery-notice">
            <div className="portal-recovery-icon">
              ✓
            </div>

            <div>
              <strong>Your invitation has been verified.</strong>

              <p>
                Once your password is created, your Student Portal will
                be activated automatically.
              </p>
            </div>
          </div>

          <form
            className="portal-login-form"
            onSubmit={submit}
          >
            <label className="portal-login-field">
              <span>Password</span>

              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="At least 8 characters"
                required
              />
            </label>

            <label className="portal-login-field">
              <span>Confirm password</span>

              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Enter your password again"
                required
              />
            </label>

            {error ? (
              <div className="login-error">
                {error}
              </div>
            ) : null}

            <button
              className="portal-login-submit"
              type="submit"
              disabled={working}
            >
              {working
                ? "Completing setup…"
                : "Create Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}


