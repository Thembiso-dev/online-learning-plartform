import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../firebase';
import './AdminDashboard.css'; // We'll create this

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

  // Mock data for dashboard
  const stats = {
    totalUsers: 1247,
    totalCourses: 89,
    activeLecturers: 42,
    pendingApprovals: 12,
    revenue: 45230,
    growth: 15.3
  };

  const recentActivities = [
    { id: 1, action: 'New course created', user: 'Dr. Smith', time: '2 min ago', type: 'course' },
    { id: 2, action: 'User registered', user: 'john.doe@email.com', time: '5 min ago', type: 'user' },
    { id: 3, action: 'Payment received', user: 'Sarah Wilson', time: '1 hour ago', type: 'payment' },
    { id: 4, action: 'Course updated', user: 'Prof. Johnson', time: '2 hours ago', type: 'course' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return (
          <div className="tab-content">
            <div className="content-header">
              <h2>Course Management</h2>
              <button className="btn-primary">+ Add New Course</button>
            </div>
            <div className="courses-grid">
              {/* Course management content */}
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="tab-content">
            <div className="content-header">
              <h2>User Management</h2>
              <button className="btn-primary">+ Add User</button>
            </div>
            {/* User management content */}
          </div>
        );
      default:
        return (
          <div className="overview-content">
            <div className="welcome-banner">
              <div className="welcome-text">
                <h2>Welcome back, {currentUser?.displayName || 'Admin'}! 👋</h2>
                <p>Here's what's happening with your platform today.</p>
              </div>
              <div className="welcome-stats">
                <div className="stat-badge">
                  <span className="stat-number">+{stats.growth}%</span>
                  <span className="stat-label">Growth</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">👥</div>
                <div className="stat-info">
                  <h3>{stats.totalUsers.toLocaleString()}</h3>
                  <p>Total Users</p>
                </div>
                <div className="stat-trend positive">+12%</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon courses">📚</div>
                <div className="stat-info">
                  <h3>{stats.totalCourses}</h3>
                  <p>Total Courses</p>
                </div>
                <div className="stat-trend positive">+5%</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon lecturers">👨‍🏫</div>
                <div className="stat-info">
                  <h3>{stats.activeLecturers}</h3>
                  <p>Active Lecturers</p>
                </div>
                <div className="stat-trend positive">+3%</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon revenue">💰</div>
                <div className="stat-info">
                  <h3>${stats.revenue.toLocaleString()}</h3>
                  <p>Total Revenue</p>
                </div>
                <div className="stat-trend positive">+{stats.growth}%</div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="activities-section">
              <div className="section-header">
                <h3>Recent Activities</h3>
                <button className="btn-text">View All</button>
              </div>
              <div className="activities-list">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'course' && '📚'}
                      {activity.type === 'user' && '👤'}
                      {activity.type === 'payment' && '💰'}
                    </div>
                    <div className="activity-details">
                      <p className="activity-action">{activity.action}</p>
                      <p className="activity-user">{activity.user}</p>
                    </div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-card" onClick={() => setActiveTab('courses')}>
                  <div className="action-icon">📚</div>
                  <span>Manage Courses</span>
                </button>
                <button className="action-card" onClick={() => setActiveTab('users')}>
                  <div className="action-icon">👥</div>
                  <span>Manage Users</span>
                </button>
                <button className="action-card">
                  <div className="action-icon">📊</div>
                  <span>View Reports</span>
                </button>
                <button className="action-card">
                  <div className="action-icon">⚙️</div>
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">🎓</div>
            <span className="logo-text">EduPlatform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-label">MAIN</div>
            <button 
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Overview</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              <span className="nav-icon">📚</span>
              <span className="nav-text">Courses</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-text">Users</span>
            </button>
          </div>

          <div className="nav-section">
            <div className="nav-label">OTHER</div>
            <button className="nav-item">
              <span className="nav-icon">⚙️</span>
              <span className="nav-text">Settings</span>
            </button>
            <button className="nav-item" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span className="nav-text">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Manage your learning platform efficiently</p>
          </div>
          <div className="header-right">
            <div className="user-menu">
              <div className="user-avatar">
                {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser?.displayName || 'Administrator'}</span>
                <span className="user-role">Admin</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;