import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { SpinnerButton } from "../components/Spinner";
import "../styles/platform.scss";

export default function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error: authError } = await signInWithGoogle();
    setLoading(false);

    if (authError) {
      toast.error(authError.message || "Google sign in failed");
      return;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <img src="/logo.png" alt="" />
          MenuCraft
        </Link>
        <h1>Get started</h1>
        <p className="auth-muted">Continue with Google to manage your restaurant menu.</p>

        <div className="auth-form">
          <button
            type="button"
            className="btn btn--ghost auth-submit"
            disabled={loading}
            onClick={handleGoogleSignIn}
          >
            <SpinnerButton loading={loading}>
              {loading ? "Redirecting…" : "Continue with Google"}
            </SpinnerButton>
          </button>
        </div>
      </div>
    </div>
  );
}
