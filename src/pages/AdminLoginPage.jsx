import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft } from "@untitledui/icons";
import { requireSupabase } from "../lib/supabase";
import { setAdminSession } from "../lib/adminSession";
import { SpinnerButton } from "../components/Spinner";
import PasswordField from "../components/PasswordField";
import "../styles/platform.scss";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await requireSupabase().rpc("admin_login", {
        p_login_id: loginId.trim(),
        p_password: password,
      });

      if (error) {
        toast.error(error.message || "Admin login failed. Run supabase/admin.sql.");
        return;
      }

      if (!data) {
        toast.error("Invalid admin ID or password");
        return;
      }

      setAdminSession(loginId.trim());
      toast.success("Signed in to admin");
      navigate("/admin", { replace: true });
    } catch (err) {
      toast.error(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <img src="/logo.png" alt="" />
          MenuCraft Admin
        </Link>
        <h1>Admin login</h1>
        <p className="auth-muted">Sign in with your admin ID and password.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Admin ID</span>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              autoComplete="username"
              placeholder="Admin ID"
              disabled={loading}
            />
          </label>

          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />

          <div className="auth-actions">
            <Link to="/" className="btn btn--ghost auth-back-btn" aria-label="Go back">
              <ArrowLeft />
            </Link>
            <button
              type="submit"
              className="btn btn--primary auth-submit"
              disabled={loading}
            >
              <SpinnerButton loading={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </SpinnerButton>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
