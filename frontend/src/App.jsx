import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { ToastProvider } from "./ToastContext";
import { Moon, Sun, Menu, X } from "lucide-react";
import SleepLogForm from "./pages/SleepLogForm";
import SleepHistory from "./pages/SleepHistory";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";
import GoalForm from "./pages/GoalForm";
import Timeline from "./pages/Timeline";
import Trends from "./pages/Trends";
import ExportPDF from "./pages/ExportPDF";
import WearableImport from "./pages/WearableImport";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";

function NavBar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" onClick={() => setOpen(false)}>SleepSync</Link>
      <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <div className={`nav-links${open ? " open" : ""}`}>
        {user ? (
          <>
            <Link to="/log" onClick={() => setOpen(false)}>Log</Link>
            <Link to="/history" onClick={() => setOpen(false)}>History</Link>
            <Link to="/timeline" onClick={() => setOpen(false)}>Timeline</Link>
            <Link to="/dashboard" onClick={() => setOpen(false)}>Stats</Link>
            <Link to="/trends" onClick={() => setOpen(false)}>Trends</Link>
            <Link to="/goal" onClick={() => setOpen(false)}>Goal</Link>
            <Link to="/recommend" onClick={() => setOpen(false)}>AI</Link>
            <Link to="/export" onClick={() => setOpen(false)}>Export</Link>
            <Link to="/import" onClick={() => setOpen(false)}>Import</Link>
            <span className="nav-user">{user.username}</span>
            <button className="nav-logout" onClick={() => { logout(); setOpen(false); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
            <Link to="/register" onClick={() => setOpen(false)}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function Home() {
  return (
    <div className="page home">
      <div className="home-content">
        <h1>SleepSync</h1>
        <p className="home-tagline">Track your sleep. Build better habits.</p>
        <div className="home-features">
          <div className="home-feature animate-in">
            <div className="home-feature-icon">🌙</div>
            <h3>Log Sleep</h3>
            <p>Record bed time, wake time, quality, and lifestyle factors</p>
          </div>
          <div className="home-feature animate-in animate-in-delay-1">
            <div className="home-feature-icon">📊</div>
            <h3>Analytics</h3>
            <p>Charts, streaks, consistency scores, and trend analysis</p>
          </div>
          <div className="home-feature animate-in animate-in-delay-2">
            <div className="home-feature-icon">🤖</div>
            <h3>AI Insights</h3>
            <p>Personalized recommendations and optimal wind-down times</p>
          </div>
        </div>
        <Link to="/register" className="home-cta">Get Started</Link>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <p className="page">Loading...</p>;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/log" element={user ? <SleepLogForm /> : <Login />} />
      <Route path="/history" element={user ? <SleepHistory /> : <Login />} />
      <Route path="/timeline" element={user ? <Timeline /> : <Login />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Login />} />
      <Route path="/goal" element={user ? <GoalForm /> : <Login />} />
      <Route path="/recommend" element={user ? <Recommendations /> : <Login />} />
      <Route path="/trends" element={user ? <Trends /> : <Login />} />
      <Route path="/export" element={user ? <ExportPDF /> : <Login />} />
      <Route path="/import" element={user ? <WearableImport /> : <Login />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NavBar />
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
