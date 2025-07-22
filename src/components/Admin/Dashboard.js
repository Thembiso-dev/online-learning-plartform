import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';

function AdminDashboard() {
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
      case 'user-management':
        return (
          <div>
            <h2>User Management</h2>
            <p>Manage users, roles, and permissions.</p>
            {/* Add your UserManagement component here when available */}
          </div>
        );
      case 'course-management':
        return (
          <div>
            <h2>Course Management</h2>
            <p>Oversee all courses and their settings.</p>
            {/* Add your CourseManagement component here when available */}
          </div>
        );
      default:
        return (
          <div>
            <h2>Welcome to your Admin Dashboard</h2>
            <p>Select an option from the menu to get started.</p>
            <div className="dashboard-stats">
              <div className="stat-card">
                <h3>System Overview</h3>
                <ul>
                  <li>Manage all users</li>
                  <li>Oversee courses</li>
                  <li>Monitor system activity</li>
                  <li>Configure settings</li>
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
        <h1>Admin Dashboard</h1>
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
              className={activeTab === 'user-management' ? 'active' : ''}
              onClick={() => setActiveTab('user-management')}
            >
              User Management
            </button>
          </li>
          <li>
            <button 
              className={activeTab === 'course-management' ? 'active' : ''}
              onClick={() => setActiveTab('course-management')}
            >
              Course Management
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

export default AdminDashboard;