import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { user, profile, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && user && profile) navigate("/portal", { replace: true });
  }, [loading, user, profile, navigate]);

  if (!loading && user && profile) return <Navigate to="/portal" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    try {
      await signIn(email.trim(), password);
      const from = location.state?.from?.pathname;
      navigate(from?.startsWith("/portal") ? from : "/portal", { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="portal-eyebrow">A's Online</p>
        <h1>Welcome back</h1>
        <p>Sign in to access your learning portal, sessions, progress and Pen-E.</p>
        <form onSubmit={handleSubmit}>
          <label>Email
            <input type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>Password
            <input type="password" autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {errorMessage ? <div className="login-error">{errorMessage}</div> : null}
          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
