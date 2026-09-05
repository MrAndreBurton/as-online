import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo/as-online-logo.svg";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo,
        }
      );

      if (error) {
        throw error;
      }

      /*
       * Keep the response neutral.
       * We do not reveal whether an account exists
       * for the submitted email address.
       */
      setSubmitted(true);
    } catch (error) {
      console.error("Password recovery request failed:", error);

      setErrorMessage(
        "We couldn't process that request right now. Please try again shortly."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="portal-login-page">
      <section className="portal-login-brand">
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="portal-login-watermark"
        />

        <div className="portal-login-brand-content">
          <Link
            to="/"
            className="portal-login-brand-link"
          >
            <img
              src={logo}
              alt="A's Online"
              className="portal-login-logo"
            />

            <div>
              <p className="portal-login-brand-name">
                A&apos;s Online
              </p>

              <p className="portal-login-brand-subtitle">
                Education Operating System
              </p>
            </div>
          </Link>

          <div className="portal-login-intro">
            <p className="portal-login-kicker">
              Secure account recovery
            </p>

            <h1>
              Get back to your
              learning journey.
            </h1>

            <p className="portal-login-description">
              Request a secure password reset link
              for your A&apos;s Online Portal account.
            </p>
          </div>

          <div className="portal-login-access-note">
            <span className="portal-login-access-dot" />

            <span>
              Secure access for students,
              tutors and administrators
            </span>
          </div>
        </div>
      </section>

      <section className="portal-login-panel">
        <div className="portal-login-form-shell">
          {!submitted ? (
            <>
              <div className="portal-login-form-header">
                <p className="portal-eyebrow">
                  Account Recovery
                </p>

                <h2>Forgot your password?</h2>

                <p>
                  Enter the email address associated
                  with your A&apos;s Online Portal
                  account.
                </p>
              </div>

              <form
                className="portal-login-form"
                onSubmit={handleSubmit}
              >
                <label className="portal-login-field">
                  <span>Email address</span>

                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </label>

                {errorMessage ? (
                  <div
                    className="login-error"
                    role="alert"
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  className="portal-login-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Sending instructions…"
                    : "Send reset instructions"}
                </button>
              </form>

              <div className="portal-login-footer">
                <p>
                  Remember your password?
                </p>

                <Link to="/login">
                  Return to sign in
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="portal-login-form-header">
                <p className="portal-eyebrow">
                  Check Your Email
                </p>

                <h2>Reset instructions requested</h2>

                <p>
                  If an A&apos;s Online Portal account
                  exists for that email address,
                  password reset instructions will be
                  sent shortly.
                </p>
              </div>

              <div className="portal-recovery-notice">
                <div className="portal-recovery-icon">
                  ✓
                </div>

                <div>
                  <strong>Check your inbox</strong>

                  <p>
                    Open the password reset email and
                    follow the secure link to choose a
                    new password.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="portal-login-submit"
                onClick={() => {
                  setSubmitted(false);
                  setErrorMessage("");
                }}
              >
                Send another request
              </button>

              <div className="portal-login-footer">
                <p>
                  Already have access?
                </p>

                <Link to="/login">
                  Return to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

