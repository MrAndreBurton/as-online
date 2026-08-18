import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

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
      if (updateError) throw updateError;

      navigate("/portal", { replace: true });
    } catch (err) {
      setError(
        err.message ||
          "Unable to set your password. Please reopen the invitation link."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <p className="portal-eyebrow">A's Online</p>
        <h1>Create your password</h1>
        <p>
          Complete your A's Online account to access your Student Portal.
        </p>

        <form onSubmit={submit}>
          <label>
            Password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <label>
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" disabled={working}>
            {working ? "Saving…" : "Create Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
