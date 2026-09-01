import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { SpinnerButton } from "../components/Spinner";
import PasswordField from "../components/PasswordField";
import "../styles/platform.scss";

export default function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { data, error: authError } = await signUp(email, password);
    setLoading(false);

    if (authError) {
      toast.error(authError.message || "Could not create account");
      return;
    }

    if (data.session) {
      toast.success("Account created successfully");
      navigate("/dashboard", { replace: true });
      return;
    }

    toast.success("Account created! Check your email to confirm, then sign in.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <img src="/logo.png" alt="" />
          MenuCraft
        </Link>
        <h1>Create account</h1>
        <p className="auth-muted">Start building your digital menu in minutes.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@restaurant.com"
              disabled={loading}
            />
          </label>

          <PasswordField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            disabled={loading}
          />

          <PasswordField
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            autoComplete="new-password"
            disabled={loading}
          />

          <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
            <SpinnerButton loading={loading}>
              {loading ? "Creating…" : "Create account"}
            </SpinnerButton>
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
