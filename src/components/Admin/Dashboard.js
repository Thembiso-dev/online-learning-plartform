import { useEffect, useState } from 'react';
import { User, BookOpen, UserCheck, UserX, Users, AlertCircle, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { db, auth } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, arrayRemove, getDoc } from 'firebase/firestore';
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
        status: doc.data().status || 'pending', // Default to pending for approval workflow
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
          status: doc.data().status || 'active',
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

  // Approve course function
  async function approveCourse(courseId) {
    if (window.confirm('Are you sure you want to approve this course?')) {
      try {
        await updateDoc(doc(db, 'courses', courseId), {
          status: 'approved',
          updatedAt: new Date()
        });
        
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, status: 'approved' }
            : course
        ));
        
        console.log('Course approved successfully');
      } catch (err) {
        console.error("Error approving course:", err);
        alert('Failed to approve course: ' + err.message);
      }
    }
  }

  // Reject course function
  async function rejectCourse(courseId) {
    if (window.confirm('Are you sure you want to reject this course?')) {
      try {
        await updateDoc(doc(db, 'courses', courseId), {
          status: 'rejected',
          updatedAt: new Date()
        });
        
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, status: 'rejected' }
            : course
        ));
        
        console.log('Course rejected successfully');
      } catch (err) {
        console.error("Error rejecting course:", err);
        alert('Failed to reject course: ' + err.message);
      }
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
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    
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
          {/* Course Statistics */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Course Approval Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div className="text-2xl font-bold text-yellow-600">
                  {courses.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Pending Approval</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="text-2xl font-bold text-green-600">
                  {courses.filter(c => c.status === 'approved').length}
                </div>
                <div className="text-sm text-gray-600">Approved Courses</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <div className="text-2xl font-bold text-red-600">
                  {courses.filter(c => c.status === 'rejected').length}
                </div>
                <div className="text-sm text-gray-600">Rejected Courses</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                <div className="text-sm text-gray-600">Total Courses</div>
              </div>
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
                        <div className="font-medium text-gray-900">{course.name}</div>
                        {course.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {course.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getLecturerName(course.lecturerId)}
                      </td>
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {course.studentsEnrolled?.length || 0}
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
                          course.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : course.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
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
                                student?.status === 'active' 
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