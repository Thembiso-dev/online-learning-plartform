import { useState } from "react";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResetEmailSent(false);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role || "student"; // fallback role if missing
        navigate(`/${userRole}/dashboard`);
      } else {
        setError("User profile not found. Contact administrator.");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.code === "auth/user-not-found") {
        setError("No account found with this email address.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Try again later.");
      } else {
        setError("Failed to log in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setResetEmailSent(false);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address to reset password.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to send password reset email. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Log In</h2>

        {error && <div className="error-message" style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
        {resetEmailSent && <div className="success-message" style={{ color: "green", marginBottom: "1rem" }}>
          Password reset email sent! Check your inbox.
        </div>}

        <form onSubmit={handleSubmit} noValidate>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            autoComplete="email"
            aria-invalid={error.toLowerCase().includes("email") ? "true" : "false"}
            style={error.toLowerCase().includes("email") ? { borderColor: "red" } : {}}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
            aria-invalid={error.toLowerCase().includes("password") ? "true" : "false"}
            style={error.toLowerCase().includes("password") ? { borderColor: "red" } : {}}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>

        <p>
          <button
            onClick={handleForgotPassword}
            disabled={loading}
            style={{ cursor: "pointer", background: "none", border: "none", color: "blue", textDecoration: "underline", padding: 0 }}
          >
            Forgot Password?
          </button>
        </p>

        <p>
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
