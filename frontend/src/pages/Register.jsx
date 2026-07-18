import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../AuthContext";
import { useToast } from "../ToastContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== password2) {
      toast("Passwords don't match", "error");
      return;
    }
    setLoading(true);
    try {
      await register(username, password, password2);
      toast("Account created", "success");
      navigate("/dashboard");
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.response?.data?.detail || "Registration failed";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-card animate-in">
        <h2>Create Account</h2>

        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            autoComplete="username"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              id="password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="password2">Confirm password</label>
          <input
            id="password2"
            type={showPw ? "text" : "password"}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {password && password2 && password !== password2 && (
            <span className="field-error">Passwords don't match</span>
          )}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? <><Loader2 size={16} className="spin" /> Creating…</> : <><UserPlus size={16} /> Create Account</>}
        </button>

        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
