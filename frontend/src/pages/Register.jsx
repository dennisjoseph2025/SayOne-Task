import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function Register() {
  const { register } = useAuth();
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
      await register(username, password);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data?.username) setError(Array.isArray(data.username) ? data.username[0] : data.username);
      else if (data?.password) setError(Array.isArray(data.password) ? data.password[0] : data.password);
      else if (data?.detail) setError(data.detail);
      else setError("Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Register</h1>
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
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
