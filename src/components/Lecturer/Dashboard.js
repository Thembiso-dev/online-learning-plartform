import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';

function LecturerDashboard() {
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
        return (
          <div>
            <h2>My Courses</h2>
            <p>Here you can view and manage the courses you're teaching.</p>
            {/* Add your LecturerMyCourses component here when available */}
          </div>
        );
      case 'create-course':
        return (
          <div>
            <h2>Create New Course</h2>
            <p>Create a new course for students to enroll in.</p>
            {/* Add your CreateCourse component here when available */}
          </div>
        );
      default:
        return (
          <div>
            <h2>Welcome to your Lecturer Dashboard</h2>
            <p>Select an option from the menu to get started.</p>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>Quick Actions</h3>
                <ul>
                  <li>View your courses</li>
                  <li>Create new courses</li>
                  <li>Manage course content</li>
                  <li>Track student progress</li>
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
        <h1>Lecturer Dashboard</h1>
        <p>Welcome, {currentUser?.email}</p>
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
              className={activeTab === 'create-course' ? 'active' : ''}
              onClick={() => setActiveTab('create-course')}
            >
              Create New Course
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

export default LecturerDashboard;