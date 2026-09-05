import { useEffect, useState } from "react";
import {
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/logo/as-online-logo.svg";

export default function Login() {
  const { user, profile, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && user && profile) {
      navigate("/portal", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  if (!loading && user && profile) {
    return <Navigate to="/portal" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    try {
      await signIn(email.trim(), password);

      const from = location.state?.from?.pathname;

      navigate(
        from?.startsWith("/portal")
          ? from
          : "/portal",
        { replace: true }
      );
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to sign in."
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
              Your learning. Connected.
            </p>

            <h1>
              One private space for your
              learning journey.
            </h1>

            <p className="portal-login-description">
              Access sessions, learning progress,
              homework and Pen-E through the
              A&apos;s Online Education Operating
              System.
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
          <div className="portal-login-form-header">
            <p className="portal-eyebrow">
              A&apos;s Online Portal
            </p>

            <h2>Welcome back</h2>

            <p>
              Sign in with your A&apos;s Online
              account to continue.
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
              />
            </label>

            <label className="portal-login-field">
              <span>Password</span>

              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                required
              />
            </label>

            <div className="portal-login-help">
              <Link to="/forgot-password">
                Forgot password?
            </Link>
          </div>

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
                ? "Signing in…"
                : "Enter Portal"}
            </button>
          </form>

          <div className="portal-login-footer">
            <p>
              Portal access is provided to active
              A&apos;s Online students and staff.
            </p>

            <Link to="/">
              Return to main website
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

