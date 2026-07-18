import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import SleepLogForm from "./pages/SleepLogForm";
import SleepHistory from "./pages/SleepHistory";
import Dashboard from "./pages/Dashboard";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <Link to="/">SleepSync</Link>
        <div>
          <Link to="/log">Log</Link>
          <Link to="/history">History</Link>
          <Link to="/dashboard">Dashboard</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<div className="page"><h1>SleepSync</h1><p>Track your sleep, improve your life.</p></div>} />
        <Route path="/log" element={<SleepLogForm />} />
        <Route path="/history" element={<SleepHistory />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
