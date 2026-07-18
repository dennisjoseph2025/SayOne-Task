import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors;
      setError(Array.isArray(msg) ? msg[0] : msg || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Login</h1>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Username
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
