import { useState } from 'react';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false); // To show reset email sent message
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userRole = userData.role;
        
        // Navigate to appropriate dashboard based on role
        navigate(`/${userRole}/dashboard`);
      } else {
        throw new Error('User profile not found. Please contact administrator.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Provide user-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address format.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Please enter your email address to reset the password.');
      return;
    }

    try {
      setError('');
      setLoading(true);

      // Send password reset email via Firebase
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true); // Show success message
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Log In</h2>
        {error && <div className="error-message">{error}</div>}
        {resetEmailSent && <div className="success-message">Password reset email sent! Please check your inbox.</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        {/* Forgot Password link */}
        <p className="forgot-password-link">
          <button onClick={handleForgotPassword} disabled={loading}>
            Forgot Password?
          </button>
        </p>

        <p className="auth-link">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
