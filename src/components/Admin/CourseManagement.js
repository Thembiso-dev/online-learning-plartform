import React, { useEffect, useState } from 'react';
import { User, BookOpen, UserCheck, UserX, Plus, CheckCircle, XCircle } from 'lucide-react';

// Mock Firebase functions for demo - replace with your actual Firebase imports
const mockDb = {
  courses: [
    { id: '1', name: 'Introduction to Programming', lecturerId: 'lec1', lecturerName: 'Dr. Smith', status: 'pending', createdAt: '2024-01-15' },
    { id: '2', name: 'Data Structures', lecturerId: 'lec2', lecturerName: 'Prof. Johnson', status: 'approved', createdAt: '2024-02-01' },
    { id: '3', name: 'Web Development', lecturerId: 'lec1', lecturerName: 'Dr. Smith', status: 'rejected', createdAt: '2024-01-20' },
    { id: '4', name: 'Database Systems', lecturerId: 'lec2', lecturerName: 'Prof. Johnson', status: 'pending', createdAt: '2024-02-10' }
  ],
  users: [
    { id: 'lec1', name: 'Dr. Smith', email: 'smith@university.edu', role: 'lecturer', status: 'active', department: 'Computer Science' },
    { id: 'lec2', name: 'Prof. Johnson', email: 'johnson@university.edu', role: 'lecturer', status: 'active', department: 'Computer Science' },
    { id: 'std1', name: 'Alice Brown', email: 'alice@student.edu', role: 'student', status: 'active', department: 'Computer Science' },
    { id: 'std2', name: 'Bob Wilson', email: 'bob@student.edu', role: 'student', status: 'suspended', department: 'Mathematics' }
  ]
};

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [error] = useState(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');

  useEffect(() => {
    // Simulate fetching data
    const timer = setTimeout(() => {
      setCourses(mockDb.courses);
      setUsers(mockDb.users);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const lecturers = users.filter(user => user.role === 'lecturer');

  const addCourse = async () => {
    if (!newCourseName.trim() || !selectedLecturer) {
      alert('Please enter a course name and select a lecturer');
      return;
    }

    try {
      const lecturer = users.find(u => u.id === selectedLecturer);
      const newCourse = {
        id: Date.now().toString(),
        name: newCourseName.trim(),
        lecturerId: selectedLecturer,
        lecturerName: lecturer.name,
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCourses(prev => [...prev, newCourse]);
      setNewCourseName('');
      setSelectedLecturer('');
    } catch (err) {
      console.error("Error adding course:", err);
      alert('Failed to add course');
    }
  };

  const approveCourse = (courseId) => {
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId ? { ...course, status: 'approved' } : course
      )
    );
  };

  const rejectCourse = (courseId) => {
    setCourses(prev =>
      prev.map(course =>
        course.id === courseId ? { ...course, status: 'rejected' } : course
      )
    );
  };

  const toggleUserStatus = async (userId) => {
    if (window.confirm('Are you sure you want to change this user\'s status?')) {
      try {
        setUsers(prev => prev.map(user =>
          user.id === userId
            ? { ...user, status: user.status === 'active' ? 'suspended' : 'active' }
            : user
        ));
      } catch (err) {
        console.error("Error updating user status:", err);
        alert('Failed to update user status');
      }
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will also affect their associated courses.')) {
      try {
        setUsers(prev => prev.filter(u => u.id !== userId));
        // Also remove courses taught by this lecturer
        if (users.find(u => u.id === userId)?.role === 'lecturer') {
          setCourses(prev => prev.filter(c => c.lecturerId !== userId));
        }
      } catch (err) {
        console.error("Error deleting user:", err);
        alert('Failed to delete user');
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-lg">Loading admin dashboard...</div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      {error}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'courses'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Course Management
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          User Management
        </button>
      </div>

      {/* Course Management Tab */}
      {activeTab === 'courses' && (
        <div>
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Course</h3>
            <div className="flex flex-wrap gap-4">
              <input
                type="text"
                placeholder="Course name"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedLecturer}
                onChange={(e) => setSelectedLecturer(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Lecturer</option>
                {lecturers.map(lecturer => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.name} ({lecturer.department})
                  </option>
                ))}
              </select>
              <button
                onClick={addCourse}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">All Courses ({courses.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {courses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{course.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{course.lecturerName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : course.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : course.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{course.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {course.status !== 'approved' && (
                            <button
                              onClick={() => approveCourse(course.id)}
                              className="flex items-center px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                              title="Approve course"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                          )}
                          {course.status !== 'rejected' && (
                            <button
                              onClick={() => rejectCourse(course.id)}
                              className="flex items-center px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                              title="Reject course"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">All Users ({users.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'lecturer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.department}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`p-1 ${user.status === 'active' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                            title={user.status === 'active' ? 'Suspend user' : 'Activate user'}
                          >
                            {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete user"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;