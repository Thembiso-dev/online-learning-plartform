import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import CreateCourse from './CreateCourse'; // Import the CreateCourse component
import MyCourses from './MyCourses'; // Import the MyCourses component

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
        return <MyCourses />; // Use the MyCourses component
      case 'create-course':
        return <CreateCourse />; // Use the CreateCourse component
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