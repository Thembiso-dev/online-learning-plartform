import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import EnrollCourse from './EnrollCourse';
import StudentMyCourses from './MyCourses';

function StudentDashboard() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'my-courses':
        return <StudentMyCourses />;
      case 'enroll-course':
        return <EnrollCourse />;
      default:
        return (
          <div>
            <h2>Welcome to your Student Dashboard</h2>
            <p>Select an option from the menu to get started.</p>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Quick Actions</h3>
                <ul>
                  <li>View your enrolled courses</li>
                  <li>Enroll in new courses</li>
                  <li>Access course materials</li>
                </ul>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard container">
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <p>Welcome, {currentUser?.displayName || currentUser?.email}</p>

      </header>
      
      <nav className="dashboard-nav">
        <ul>
          <li>
            <button 
              className={activeTab === 'overview' ? 'active' : ''}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
          </li>
          <li>
            <button 
              className={activeTab === 'my-courses' ? 'active' : ''}
              onClick={() => setActiveTab('my-courses')}
            >
              My Courses
            </button>
          </li>
          <li>
            <button 
              className={activeTab === 'enroll-course' ? 'active' : ''}
              onClick={() => setActiveTab('enroll-course')}
            >
              Enroll in Courses
            </button>
          </li>
          <li>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </li>
        </ul>
      </nav>
      
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default StudentDashboard;
