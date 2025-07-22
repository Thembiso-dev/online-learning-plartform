import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SignUp from './components/Auth/Signup';
import Login from './components/Auth/Login';
import AdminDashboard from './components/Admin/Dashboard';
import LecturerDashboard from './components/Lecturer/Dashboard';
import StudentDashboard from './components/Students/Dashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          
          {/* Lecturer Routes */}
          <Route path="/lecturer/dashboard" element={<ProtectedRoute role="lecturer"><LecturerDashboard /></ProtectedRoute>} />
          
          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

function ProtectedRoute({ role, children }) {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (userRole !== role) {
    return <Navigate to={`/${userRole}/dashboard`} replace />;
  }
  
  return children;
}

function HomeRedirect() {
  const { currentUser, userRole } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={`/${userRole}/dashboard`} replace />;
}

export default App;
