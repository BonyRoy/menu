import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { SpinnerButton } from "../components/Spinner";
import PasswordField from "../components/PasswordField";
import "../styles/platform.scss";

const REMEMBER_KEY = "menucraft_remember_login";

function loadRemembered() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return { email: "", password: "", remember: false };
    const data = JSON.parse(raw);
    return {
      email: data.email || "",
      password: data.password || "",
      remember: true,
    };
  } catch {
    return { email: "", password: "", remember: false };
  }
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const remembered = loadRemembered();
  const [email, setEmail] = useState(remembered.email);
  const [password, setPassword] = useState(remembered.password);
  const [remember, setRemember] = useState(remembered.remember);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      toast.error(authError.message || "Sign in failed");
      return;
    }

    if (remember) {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ email, password }),
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    toast.success("Signed in successfully");
    navigate(from, { replace: true });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <img src="/logo.png" alt="" />
          MenuCraft
        </Link>
        <h1>Welcome back</h1>
        <p className="auth-muted">Sign in to manage your restaurant menu.</p>

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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />

          <label className="auth-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
            />
            <span>Remember me</span>
          </label>

          <button type="submit" className="btn btn--primary auth-submit" disabled={loading}>
            <SpinnerButton loading={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </SpinnerButton>
          </button>
        </form>

        <p className="auth-switch">
          No account? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
