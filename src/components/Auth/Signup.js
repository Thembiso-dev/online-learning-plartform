import { useState } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  async function handleSubmit(e) {
    e.preventDefault();

    setError(''); // clear old errors

    // Client-side validation
    if (!validateEmail(email)) {
      return setError('Please enter a valid email address.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long');
    }
    if (name.trim().length < 2) {
      return setError('Please enter a valid name');
    }

    try {
      setLoading(true);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update the user's display name
      await updateProfile(user, {
        displayName: name.trim()
      });

      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email.toLowerCase(),
        name: name.trim(),
        role,
        createdAt: new Date(),
        isActive: true
      });

      // Navigate to dashboard
      navigate(`/${role}/dashboard`);
    } catch (err) {
      console.error('Signup error code:', err.code);
      console.error('Signup error message:', err.message);

      if (err.code && err.code.startsWith('auth/')) {
        if (err.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists.');
        } else if (err.code === 'auth/weak-password') {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Invalid email address format.');
        } else {
          setError(err.message || 'Failed to create account. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Sign Up</h2>
        {error && (
          <div
            className="error-message"
            role="alert"
            style={{ color: "red", marginBottom: "1rem" }}
            id="signup-error"
          >
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setError('');
                setName(e.target.value);
              }}
              required
              disabled={loading}
              placeholder="Enter your full name"
              aria-invalid={error.toLowerCase().includes("name") ? "true" : "false"}
              aria-describedby={error.toLowerCase().includes("name") ? "signup-error" : undefined}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setError('');
                setEmail(e.target.value);
              }}
              required
              disabled={loading}
              placeholder="Enter your email"
              aria-invalid={error.toLowerCase().includes("email") ? "true" : "false"}
              aria-describedby={error.toLowerCase().includes("email") ? "signup-error" : undefined}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setError('');
                setPassword(e.target.value);
              }}
              required
              disabled={loading}
              placeholder="Enter password (min 6 characters)"
              minLength="6"
              aria-invalid={error.toLowerCase().includes("password") ? "true" : "false"}
              aria-describedby={error.toLowerCase().includes("password") ? "signup-error" : undefined}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setError('');
                setConfirmPassword(e.target.value);
              }}
              required
              disabled={loading}
              placeholder="Confirm your password"
              aria-invalid={error.toLowerCase().includes("password") ? "true" : "false"}
              aria-describedby={error.toLowerCase().includes("password") ? "signup-error" : undefined}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading || !email || !password || !confirmPassword || !name}
            className="auth-button"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
