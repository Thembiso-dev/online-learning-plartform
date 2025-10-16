import { useState } from "react";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css"; // We'll create this

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
        const userData = userDoc.data();
        const userRole = userData.role || userData.userRole || "student";
        console.log("Login - User role determined:", userRole);
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
    <div className="auth-wrapper">
      <div className="auth-container login-container">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-icon">🎓</div>
            <h1>EduPlatform</h1>
          </div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account to continue</p>
        </div>

        <div className="auth-card">
          {error && <div className="error-message">{error}</div>}
          {resetEmailSent && <div className="success-message">
            📧 Password reset email sent! Check your inbox.
          </div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <div className="input-icon">📧</div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="input-group">
              <div className="input-icon">🔒</div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit" 
              className="auth-btn primary-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="auth-links">
            <button
              onClick={handleForgotPassword}
              disabled={loading}
              className="forgot-password-btn"
            >
              Forgot your password?
            </button>
            
            <div className="signup-link">
              Don't have an account? <Link to="/signup" className="link">Sign Up</Link>
            </div>
          </div>
        </div>

        <div className="auth-features">
          <div className="feature">
            <div className="feature-icon">👨‍🏫</div>
            <span>For Lecturers</span>
          </div>
          <div className="feature">
            <div className="feature-icon">👨‍🎓</div>
            <span>For Students</span>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <span>Fast & Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
