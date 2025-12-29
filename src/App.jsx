import React, { useState, useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Link,
} from "react-router-dom";
import "./app.css";
import logo from "./logo.png";
import eyeOpen from "./vieweye.png";
import eyeClosed from "./crossedeye.png";
import Dashboard from "./pages/dashboard";
import Disbursement from "./pages/disbursement";
import Payees from "./pages/payees";
import Summary from "./pages/summary";
import ChartOfAccounts from "./pages/chartofaccounts";
import MyAccount from "./pages/myaccount";
import { AppProvider, AppContext } from "./AppContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const { loginUser } = useContext(AppContext);
  const navigate = useNavigate();

  async function handleSignIn(e) {
    e.preventDefault();
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    const success = await loginUser({ email, password });
    if (success) {
      navigate("/dashboard");
    } else {
      alert(
        "Invalid email or password. Please try again or register for a new account."
      );
    }
  }

  return (
    <div className="page">
      <form className="card" onSubmit={handleSignIn}>
        <img src={logo} alt="logo" className="logo" />
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          placeholder="Enter Email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="label">Password</label>
        <div className="input-row">
          <input
            className="input input-password"
            type={show ? "text" : "password"}
            placeholder="Enter Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShow((s) => !s)}
            aria-label="toggle password"
          >
            <img
              src={show ? eyeOpen : eyeClosed}
              alt={show ? "Show password" : "Hide password"}
              style={{ width: 28, height: 28, display: "block" }}
            />
          </button>
        </div>
        <button className="signin" type="submit">
          Sign In
        </button>
        <Link to="/register" className="small-link">
          Don't have an account?
        </Link>
      </form>
    </div>
  );
}

function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const { registerUser } = useContext(AppContext);
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }
    const success = await registerUser({
      firstName,
      lastName,
      email,
      password,
    });
    if (success) {
      alert("Registration successful! Please log in.");
      navigate("/");
    }
  }

  return (
    <div className="page">
      <form className="card" onSubmit={handleRegister}>
        <img src={logo} alt="logo" className="logo" />
        <h2 style={{ textAlign: "center", color: "#333" }}>Create Account</h2>
        <label className="label">First Name</label>
        <input
          className="input"
          type="text"
          placeholder="Enter First Name..."
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <label className="label">Last Name</label>
        <input
          className="input"
          type="text"
          placeholder="Enter Last Name..."
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          placeholder="Enter Email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="label">Password</label>
        <div className="input-row">
          <input
            className="input input-password"
            type={show ? "text" : "password"}
            placeholder="Enter Password..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="eye-btn"
            onClick={() => setShow((s) => !s)}
            aria-label="toggle password"
          >
            <img
              src={show ? eyeOpen : eyeClosed}
              alt={show ? "Show password" : "Hide password"}
              style={{ width: 28, height: 28, display: "block" }}
            />
          </button>
        </div>
        <button className="signin" type="submit">
          Sign Up
        </button>
        <Link to="/" className="small-link">
          Already have an account?
        </Link>
      </form>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/disbursement" element={<Disbursement />} />
          <Route path="/payees" element={<Payees />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/chartofaccounts" element={<ChartOfAccounts />} />
          <Route path="/my-account" element={<MyAccount />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
