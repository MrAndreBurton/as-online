import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import logo from "../assets/logo/as-online-logo.svg";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [recoverySessionReady, setRecoverySessionReady] = useState(false);

  const [working, setWorking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkRecoverySession() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error(
            "Unable to verify password recovery session:",
            sessionError
          );
        }

        if (session) {
          setRecoverySessionReady(true);
        }
      } catch (err) {
        console.error(
          "Unable to verify password recovery session:",
          err
        );
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoverySessionReady(true);
        setCheckingSession(false);
      }
    });

    checkRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

    if (!recoverySessionReady) {
      setError(
        "Your password reset session is unavailable. Please request a new reset link."
      );
      return;
    }

    setWorking(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      /*
       * Close the temporary recovery session.
       * The user must sign in again using the new password.
       */
      const { error: signOutError } =
        await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "Password changed, but recovery session sign-out failed:",
          signOutError
        );
      }
    } catch (err) {
      console.error("Password reset failed:", err);

      setError(
        err.message ||
          "Unable to update your password. Please request a new reset link."
      );
    } finally {
      setWorking(false);
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
              Choose a new
              <br />
              portal password.
            </h1>

            <p className="portal-login-description">
              Restore secure access to your sessions,
              learning progress, homework and
              A&apos;s Online account.
            </p>
          </div>

          <div className="portal-login-access-note">
            <span className="portal-login-access-dot" />

            <span>
              Secure access for students, tutors
              and administrators
            </span>
          </div>
        </div>
      </section>

      <section className="portal-login-panel">
        <div className="portal-login-form-shell">
          {checkingSession ? (
            <div className="portal-login-form-header">
              <p className="portal-eyebrow">
                Account Recovery
              </p>

              <h2>Verifying reset link…</h2>

              <p>
                We&apos;re securely verifying your
                password recovery request.
              </p>
            </div>
          ) : success ? (
            <>
              <div className="portal-login-form-header">
                <p className="portal-eyebrow">
                  Password Updated
                </p>

                <h2>You&apos;re all set.</h2>

                <p>
                  Your new password has been saved.
                  Sign in again to continue to the
                  A&apos;s Online Portal.
                </p>
              </div>

              <div className="portal-recovery-notice">
                <div className="portal-recovery-icon">
                  ✓
                </div>

                <div>
                  <strong>
                    Password changed successfully
                  </strong>

                  <p>
                    Your recovery session has been
                    closed for security.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="portal-login-submit"
                onClick={() =>
                  navigate("/login", {
                    replace: true,
                  })
                }
              >
                Return to Portal Sign In
              </button>
            </>
          ) : recoverySessionReady ? (
            <>
              <div className="portal-login-form-header">
                <p className="portal-eyebrow">
                  Set New Password
                </p>

                <h2>Create your new password</h2>

                <p>
                  Choose a password with at least
                  8 characters.
                </p>
              </div>

              <form
                className="portal-login-form"
                onSubmit={submit}
              >
                <label className="portal-login-field">
                  <span>New password</span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter new password"
                    minLength={8}
                    required
                    autoFocus
                  />
                </label>

                <label className="portal-login-field">
                  <span>Confirm new password</span>

                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    minLength={8}
                    required
                  />
                </label>

                {error ? (
                  <div
                    className="login-error"
                    role="alert"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  className="portal-login-submit"
                  type="submit"
                  disabled={working}
                >
                  {working
                    ? "Updating password…"
                    : "Update password"}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="portal-login-form-header">
                <p className="portal-eyebrow">
                  Reset Link Unavailable
                </p>

                <h2>
                  This reset link can&apos;t be used.
                </h2>

                <p>
                  The link may have expired, already
                  been used, or may not be a valid
                  password recovery link.
                </p>
              </div>

              <Link
                to="/forgot-password"
                className="portal-login-submit portal-login-button-link"
              >
                Request a new reset link
              </Link>

              <div className="portal-login-footer">
                <p>
                  Remember your password?
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

