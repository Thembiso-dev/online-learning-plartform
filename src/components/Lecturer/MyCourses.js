import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // ✅ Added

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [openCourseActions, setOpenCourseActions] = useState({});
  const { currentUser } = useAuth();
  const navigate = useNavigate(); // ✅ Added

  useEffect(() => {
    if (currentUser) {
      fetchMyCourses();
      const interval = setInterval(fetchMyCourses, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const coursesQuery = query(
        collection(db, 'courses'),
        where('lecturerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(coursesQuery);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCourses(coursesData);
      setLastUpdated(new Date());
    } catch (error) {
      try {
        const fallbackQuery = query(
          collection(db, 'courses'),
          where('lecturerId', '==', currentUser.uid)
        );

        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackData = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setCourses(fallbackData);
        setLastUpdated(new Date());
      } catch (fallbackError) {
        console.error('Error fetching courses:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActions = (courseId) => {
    setOpenCourseActions(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    return course.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' };
      case 'approved': return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' };
      case 'rejected': return { bg: '#f8d7da', color: '#721c24', border: '#f5c6cb' };
      default: return { bg: '#f8f9fa', color: '#495057', border: '#dee2e6' };
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return 'Your course is waiting for admin approval. You will be notified once it\'s reviewed.';
      case 'approved': return 'Congratulations! Your course is live and students can enroll.';
      case 'rejected': return 'Your course was not approved. Please contact the admin for feedback and resubmission guidelines.';
      default: return 'Status unknown. Please contact support.';
    }
  };

  const getActionMessage = (status) => {
    switch (status) {
      case 'pending': return 'Please wait for admin review. This usually takes 1-2 business days.';
      case 'approved': return 'Students can now find and enroll in your course. You can start managing course content.';
      case 'rejected': return 'You may revise and resubmit your course after addressing admin feedback.';
      default: return '';
    }
  };

  const toolBtnStyle = {
    padding: '10px',
    fontSize: '13px',
    backgroundColor: '#f1f1f1',
    border: '1px solid #ccc',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center'
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading your courses...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>My Courses</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchMyCourses} style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
            🔄 Refresh Status
          </button>
          <button onClick={() => window.location.reload()} style={{ backgroundColor: '#007bff', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
            🔃 Hard Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #dee2e6' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#495057' }}>Total Courses</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>{courses.length}</p>
        </div>
        <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ffeaa7' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#856404' }}>Pending</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>{courses.filter(c => c.status === 'pending').length}</p>
        </div>
        <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #c3e6cb' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#155724' }}>Approved</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>{courses.filter(c => c.status === 'approved').length}</p>
        </div>
        <div style={{ backgroundColor: '#f8d7da', padding: '15px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f5c6cb' }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#721c24' }}>Rejected</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>{courses.filter(c => c.status === 'rejected').length}</p>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ marginBottom: '20px' }}>
        {['all', 'pending', 'approved', 'rejected'].map(filterOption => (
          <button key={filterOption} onClick={() => setFilter(filterOption)} style={{
            backgroundColor: filter === filterOption ? '#007bff' : '#f8f9fa',
            color: filter === filterOption ? 'white' : '#333',
            border: '1px solid #ddd',
            padding: '8px 16px',
            marginRight: '8px',
            borderRadius: '4px',
            cursor: 'pointer',
            textTransform: 'capitalize'
          }}>
            {filterOption} ({courses.filter(c => filterOption === 'all' || c.status === filterOption).length})
          </button>
        ))}
      </div>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          {courses.length === 0 ? (
            <div>
              <p>You haven't created any courses yet.</p>
              <p>Click on "Create New Course" to get started!</p>
            </div>
          ) : (
            <p>No courses found for the selected filter.</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredCourses.map(course => {
            const statusStyle = getStatusColor(course.status);
            return (
              <div key={course.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', backgroundColor: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    {/* ✅ Course title now clickable */}
                    <h3
                      onClick={() => navigate(`/lecturer/courses/${course.id}`)}
                      style={{
                        margin: '0 0 10px 0',
                        color: '#007bff',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      {course.title}
                    </h3>

                    <p style={{ color: '#666', margin: '0 0 15px 0' }}>{course.description}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '14px', color: '#555', marginBottom: '15px' }}>
                      <div><strong>Category:</strong> {course.category}</div>
                      <div><strong>Duration:</strong> {course.duration}</div>
                      <div><strong>Max Students:</strong> {course.maxStudents}</div>
                      <div><strong>Enrolled:</strong> {course.enrollmentCount || 0}</div>
                      <div><strong>Created:</strong> {course.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                      <div><strong>Last Updated:</strong> {course.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                    </div>

                    <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: '14px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Status: {course.status.toUpperCase()}</div>
                      <div>{getStatusMessage(course.status)}</div>
                      <div style={{ marginTop: '5px', fontSize: '12px', fontStyle: 'italic' }}>{getActionMessage(course.status)}</div>
                    </div>

                    {/* Course Actions Panel */}
                    {course.status === 'approved' && (
                      <div style={{ marginTop: '15px' }}>
                        <button onClick={() => toggleActions(course.id)} style={{
                          padding: '8px 12px',
                          fontSize: '14px',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}>
                          {openCourseActions[course.id] ? 'Hide' : 'Manage'} Course Content
                        </button>

                        {openCourseActions[course.id] && (
                          <div style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                            <h4 style={{ marginBottom: '10px' }}>📂 Course Tools</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                              <button style={toolBtnStyle}>📤 Upload Video</button>
                              <button style={toolBtnStyle}>📝 Add Lecture Notes</button>
                              <button style={toolBtnStyle}>🖼️ Upload Image</button>
                              <button style={toolBtnStyle}>📁 Upload File</button>
                              <button style={toolBtnStyle}>📚 Add Assignment</button>
                              <button style={toolBtnStyle}>🧾 Grade Submissions</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: '20px', textAlign: 'center' }}>
                    <div style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      textTransform: 'uppercase',
                      minWidth: '80px'
                    }}>
                      {course.status}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyCourses;
