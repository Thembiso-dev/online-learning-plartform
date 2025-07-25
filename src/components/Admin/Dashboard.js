import { useEffect, useState } from 'react';
import { User, BookOpen, Trash2, Edit3, UserCheck, UserX, Plus, Users, AlertCircle, LogOut } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';

function AdminDashboard() {
  const [user] = useAuthState(auth);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [error, setError] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseDescription, setNewCourseDescription] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [hasUserAccess, setHasUserAccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user data
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      }

      // Fetch courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().title || doc.data().name || 'Untitled Course',
        title: doc.data().title || doc.data().name || 'Untitled Course',
        description: doc.data().description || '',
        lecturerId: doc.data().lecturerId || '',
        studentsEnrolled: doc.data().studentsEnrolled || [],
        status: doc.data().status || 'Pending',
        createdAt: doc.data().createdAt?.toDate?.()?.toLocaleDateString() || 
                  doc.data().createdAt?.toLocaleDateString?.() || 
                  new Date().toLocaleDateString()
      }));
      setCourses(coursesData);

      // Fetch users
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().displayName || doc.data().name || doc.data().email?.split('@')[0] || 'Unknown User',
          email: doc.data().email || 'No email',
          role: doc.data().role || 'student',
          status: doc.data().status || 'Pending',
          department: doc.data().department || 'Not specified'
        }));
        setUsers(usersData);
        setHasUserAccess(true);
      } catch (userError) {
        console.error("Error fetching users:", userError);
        setHasUserAccess(false);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const lecturers = users.filter(user => user.role === 'lecturer');
  const students = users.filter(user => user.role === 'student');

  const getLecturerName = (lecturerId) => {
    const lecturer = users.find(u => u.id === lecturerId);
    return lecturer ? lecturer.name : 'Unknown Lecturer';
  };

  const getStudentName = (studentId) => {
    const student = users.find(u => u.id === studentId);
    return student ? student.name : 'Unknown Student';
  };

  async function addCourse() {
    if (!newCourseName.trim() || !selectedLecturer) {
      alert('Please enter a course name and select a lecturer');
      return;
    }

    try {
      const courseData = {
        title: newCourseName.trim(),
        description: newCourseDescription.trim() || '',
        lecturerId: selectedLecturer,
        createdAt: new Date(),
        studentsEnrolled: [],
        status: 'Pending'
      };
      
      const docRef = await addDoc(collection(db, 'courses'), courseData);
      
      const newCourse = {
        id: docRef.id,
        ...courseData,
        name: newCourseName.trim(),
        createdAt: new Date().toLocaleDateString()
      };
      
      setCourses(prev => [...prev, newCourse]);
      setNewCourseName('');
      setNewCourseDescription('');
      setSelectedLecturer('');
    } catch (err) {
      console.error("Error adding course:", err);
      alert('Failed to add course: ' + err.message);
    }
  }

  async function deleteCourse(courseId) {
    if (window.confirm('Are you sure you want to delete this course? This will unenroll all students.')) {
      try {
        await deleteDoc(doc(db, 'courses', courseId));
        setCourses(prev => prev.filter(c => c.id !== courseId));
      } catch (err) {
        console.error("Error deleting course:", err);
        alert('Failed to delete course: ' + err.message);
      }
    }
  }

  async function toggleCourseStatus(courseId) {
    try {
      const course = courses.find(c => c.id === courseId);
      const newStatus = course.status === 'Pending' ? 'Rejected' : 'Approved';

      await updateDoc(doc(db, 'courses', courseId), {
        status: newStatus
      });
      
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, status: newStatus }
          : course
      ));
    } catch (err) {
      console.error("Error updating course status:", err);
      alert('Failed to update course status: ' + err.message);
    }
  }

  async function updateCourse(courseId, updatedName) {
    if (!updatedName.trim()) {
      alert('Course name cannot be empty');
      return;
    }

    try {
      await updateDoc(doc(db, 'courses', courseId), {
        title: updatedName.trim()
      });
      
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, title: updatedName.trim(), name: updatedName.trim() } 
          : course
      ));
      setEditingCourse(null);
    } catch (err) {
      console.error("Error updating course:", err);
      alert('Failed to update course: ' + err.message);
    }
  }

  async function removeStudentFromCourse(courseId, studentId) {
    if (window.confirm('Remove this student from the course?')) {
      try {
        await updateDoc(doc(db, 'courses', courseId), {
          studentsEnrolled: arrayRemove(studentId)
        });
        
        setCourses(prev => prev.map(c => 
          c.id === courseId 
            ? { ...c, studentsEnrolled: c.studentsEnrolled.filter(id => id !== studentId) }
            : c
        ));
        
        if (selectedCourse?.id === courseId) {
          setEnrolledStudents(prev => prev.filter(id => id !== studentId));
        }
      } catch (err) {
        console.error("Error removing student:", err);
        alert('Failed to remove student: ' + err.message);
      }
    }
  }

  async function toggleUserStatus(userId) {
    const user = users.find(u => u.id === userId);
    const newStatus = user.status === 'Pending' ? 'suspended' : 'activated';
    
    if (window.confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} this user?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), {
          status: newStatus
        });
        
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
      } catch (err) {
        console.error("Error updating user status:", err);
        alert('Failed to update user status: ' + err.message);
      }
    }
  }

  async function deleteUser(userId) {
    const user = users.find(u => u.id === userId);
    if (window.confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        setUsers(prev => prev.filter(u => u.id !== userId));
        
        if (user.role === 'lecturer') {
          const lecturerCourses = courses.filter(c => c.lecturerId === userId);
          for (const course of lecturerCourses) {
            await deleteDoc(doc(db, 'courses', course.id));
          }
          setCourses(prev => prev.filter(c => c.lecturerId !== userId));
        }
        
        if (user.role === 'student') {
          const enrolledCourses = courses.filter(c => c.studentsEnrolled?.includes(userId));
          for (const course of enrolledCourses) {
            await updateDoc(doc(db, 'courses', course.id), {
              studentsEnrolled: arrayRemove(userId)
            });
          }
          setCourses(prev => prev.map(c => ({
            ...c,
            studentsEnrolled: c.studentsEnrolled?.filter(id => id !== userId) || []
          })));
        }
      } catch (err) {
        console.error("Error deleting user:", err);
        alert('Failed to delete user: ' + err.message);
      }
    }
  }

  const viewCourseStudents = (course) => {
    setSelectedCourse(course);
    setEnrolledStudents(course.studentsEnrolled || []);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-lg">Loading admin dashboard...</div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
      <div className="font-bold">Error:</div>
      <div>{error}</div>
      <button 
        onClick={fetchData}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
      
      {!hasUserAccess && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <div>
              <div className="font-bold">Limited Permissions</div>
              <div className="text-sm">User management features are restricted due to insufficient permissions.</div>
            </div>
          </div>
        </div>
      )}
      
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
          disabled={!hasUserAccess}
          className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'users' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : !hasUserAccess
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          User Management {!hasUserAccess && '(Restricted)'}
        </button>
        <button
          onClick={() => setActiveTab('enrollments')}
          className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'enrollments' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4 mr-2" />
          Enrollment Management
        </button>
      </div>

      {activeTab === 'courses' && (
        <div>
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Course</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Course title"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Course description"
                value={newCourseDescription}
                onChange={(e) => setNewCourseDescription(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={selectedLecturer}
                onChange={(e) => setSelectedLecturer(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Lecturer</option>
                {lecturers.map(lecturer => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.name}
                  </option>
                ))}
              </select>
              <button
                onClick={addCourse}
                className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {courses.map(course => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {editingCourse === course.id ? (
                          <input
                            type="text"
                            defaultValue={course.name}
                            onBlur={(e) => updateCourse(course.id, e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && updateCourse(course.id, e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : (
                          <div className="font-medium text-gray-900">{course.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getLecturerName(course.lecturerId)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'Pending' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.studentsEnrolled?.length || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{course.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingCourse(editingCourse === course.id ? null : course.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit course"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleCourseStatus(course.id)}
                            className={`p-1 ${course.status === 'Pending' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                            title={course.status === 'Pending' ? 'Rejected' : 'Approved'}
                          >
                            {course.status === 'Pending' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete course"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {activeTab === 'users' && (
        <div>
          {hasUserAccess ? (
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
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'Pending' 
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
                              className={`p-1 ${user.status === 'Pending' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                              title={user.status === 'Pending' ? 'Suspend user' : 'Activate user'}
                            >
                              {user.status === 'Pending' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">User Management Not Available</h3>
              <p className="text-gray-600 mb-4">
                You don't have the necessary permissions to access user management features.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'enrollments' && (
        <div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Enrollment Overview</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">{students.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="text-2xl font-bold text-purple-600">
                  {courses.reduce((total, course) => total + (course.studentsEnrolled?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Enrollments</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Course Enrollments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {courses.map(course => (
                    <tr 
                      key={course.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${selectedCourse?.id === course.id ? 'bg-blue-50' : ''}`}
                      onClick={() => viewCourseStudents(course)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{course.name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getLecturerName(course.lecturerId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.studentsEnrolled?.length || 0} students
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.status === 'Pending' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {course.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewCourseStudents(course);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Students
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedCourse && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  Students in "{selectedCourse.name}" ({enrolledStudents.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {enrolledStudents.length > 0 ? (
                      enrolledStudents.map(studentId => {
                        const student = students.find(s => s.id === studentId);
                        return (
                          <tr key={studentId} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">
                                {student ? student.name : 'Unknown Student'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {student?.email || 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                student?.status === 'Pending' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student?.status || 'unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => removeStudentFromCourse(selectedCourse.id, studentId)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No students enrolled in this course
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;