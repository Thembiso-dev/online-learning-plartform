import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { CheckCircle, XCircle, Clock, Eye, EyeOff, Search, Filter } from 'lucide-react';

function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [processingCourse, setProcessingCourse] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all courses
      const coursesQuery = query(
        collection(db, 'courses'),
        orderBy('createdAt', 'desc')
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesList = coursesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      // Fetch lecturers to get their names
      const lecturersQuery = query(
        collection(db, 'users'),
        where('role', '==', 'lecturer')
      );
      const lecturersSnapshot = await getDocs(lecturersQuery);
      const lecturersMap = {};
      lecturersSnapshot.docs.forEach(doc => {
        lecturersMap[doc.id] = doc.data();
      });
      
      setCourses(coursesList);
      setLecturers(lecturersMap);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const updateCourseStatus = async (courseId, newStatus, feedback = '') => {
    try {
      setProcessingCourse(courseId);
      
      const courseRef = doc(db, 'courses', courseId);
      const updateData = { 
        status: newStatus,
        updatedAt: new Date(),
        adminFeedback: feedback || null,
        reviewedAt: new Date()
      };
      
      await updateDoc(courseRef, updateData);
      
      setCourses(prevCourses =>
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, ...updateData }
            : course
        )
      );
      
      // Show success message
      const statusText = newStatus === 'approved' ? 'approved' : 'rejected';
      alert(`Course "${courses.find(c => c.id === courseId)?.title}" has been ${statusText} successfully!`);
      
    } catch (err) {
      console.error(`Failed to ${newStatus} course:`, err);
      alert(`Failed to ${newStatus} course. Please try again.`);
    } finally {
      setProcessingCourse(null);
    }
  };

  const handleApprove = (course) => {
    if (window.confirm(`Are you sure you want to APPROVE the course "${course.title}"?\n\nThis will make it available for student enrollment.`)) {
      updateCourseStatus(course.id, 'approved');
    }
  };

  const handleReject = (course) => {
    const feedback = window.prompt(
      `Please provide feedback for rejecting "${course.title}":\n\n(This will help the lecturer understand what needs to be improved)`,
      ''
    );
    
    if (feedback !== null) { // User didn't cancel
      if (feedback.trim() === '') {
        const confirmWithoutFeedback = window.confirm(
          'Are you sure you want to reject this course without providing feedback?\n\nFeedback helps lecturers improve their courses.'
        );
        if (!confirmWithoutFeedback) return;
      }
      
      updateCourseStatus(course.id, 'rejected', feedback.trim());
    }
  };

  // Filter and search courses
  const filteredCourses = courses.filter(course => {
    // Status filter
    const statusMatch = filter === 'all' || course.status === filter;
    
    // Search filter
    const searchMatch = searchQuery === '' || 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecturers[course.lecturerId]?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const toggleExpanded = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-8">
      <div className="text-lg">Loading courses...</div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
      {error}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
        <p className="text-gray-600">Review and manage course submissions from lecturers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Courses', value: courses.length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Pending Review', value: courses.filter(c => c.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { label: 'Approved', value: courses.filter(c => c.status === 'approved').length, color: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Rejected', value: courses.filter(c => c.status === 'rejected').length, color: 'bg-red-50 text-red-700 border-red-200' }
        ].map((stat, index) => (
          <div key={index} className={`p-4 rounded-lg border ${stat.color}`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by course title, description, category, or lecturer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Courses</option>
            <option value="pending">Pending Review ({courses.filter(c => c.status === 'pending').length})</option>
            <option value="approved">Approved ({courses.filter(c => c.status === 'approved').length})</option>
            <option value="rejected">Rejected ({courses.filter(c => c.status === 'rejected').length})</option>
          </select>
        </div>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-500 mb-2">No courses found</div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Clear search to see all courses
              </button>
            )}
          </div>
        ) : (
          filteredCourses.map(course => {
            const lecturer = lecturers[course.lecturerId];
            const isExpanded = expandedCourse === course.id;
            const isProcessing = processingCourse === course.id;
            
            return (
              <div key={course.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{course.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(course.status)}`}>
                          {getStatusIcon(course.status)}
                          {course.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                        <div><span className="font-medium">Lecturer:</span> {lecturer?.name || 'Unknown'}</div>
                        <div><span className="font-medium">Category:</span> {course.category}</div>
                        <div><span className="font-medium">Duration:</span> {course.duration}</div>
                        <div><span className="font-medium">Max Students:</span> {course.maxStudents}</div>
                        <div><span className="font-medium">Created:</span> {course.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                        <div><span className="font-medium">Last Updated:</span> {course.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                      </div>

                      {/* Course Description Preview */}
                      <div className="mb-4">
                        <p className="text-gray-700 leading-relaxed">
                          {isExpanded 
                            ? course.description 
                            : `${course.description?.substring(0, 200)}${course.description?.length > 200 ? '...' : ''}`
                          }
                        </p>
                        {course.description?.length > 200 && (
                          <button
                            onClick={() => toggleExpanded(course.id)}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                          >
                            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            {isExpanded ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                      </div>

                      {/* Admin Feedback (if rejected) */}
                      {course.status === 'rejected' && course.adminFeedback && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="font-medium text-red-800 text-sm mb-1">Admin Feedback:</div>
                          <div className="text-red-700 text-sm">{course.adminFeedback}</div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-6 flex flex-col gap-2">
                      {course.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(course)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            {isProcessing ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(course)}
                            disabled={isProcessing}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            {isProcessing ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}
                      
                      {course.status === 'approved' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                          <CheckCircle className="w-4 h-4" />
                          Approved
                        </div>
                      )}
                      
                      {course.status === 'rejected' && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg">
                          <XCircle className="w-4 h-4" />
                          Rejected
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Refresh Button */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh Courses'}
        </button>
      </div>
    </div>
  );
}

export default CourseManagement;