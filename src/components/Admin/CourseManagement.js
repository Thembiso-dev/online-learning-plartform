import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';

function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(coursesQuery);
      const coursesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setMessage({ type: 'error', text: 'Failed to load courses' });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseAction = async (courseId, action) => {
    try {
      const courseRef = doc(db, 'courses', courseId);
      const updateData = {
        status: action,
        updatedAt: new Date(),
        isActive: action === 'approved'
      };

      await updateDoc(courseRef, updateData);
      
      // Update local state
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, ...updateData }
          : course
      ));

      setMessage({ 
        type: 'success', 
        text: `Course ${action} successfully!` 
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      console.error(`Error ${action} course:`, error);
      setMessage({ type: 'error', text: `Failed to ${action} course` });
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', courseId));
      setCourses(prev => prev.filter(course => course.id !== courseId));
      setMessage({ type: 'success', text: 'Course deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error deleting course:', error);
      setMessage({ type: 'error', text: 'Failed to delete course' });
    }
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Course Management</h2>
        <button
          onClick={fetchCourses}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {message.text && (
        <div style={{
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Filter Buttons */}
      <div style={{ marginBottom: '20px' }}>
        {['all', 'pending', 'approved', 'rejected'].map(filterOption => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            style={{
              backgroundColor: filter === filterOption ? '#007bff' : '#f8f9fa',
              color: filter === filterOption ? 'white' : '#333',
              border: '1px solid #ddd',
              padding: '8px 16px',
              marginRight: '8px',
              borderRadius: '4px',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {filterOption} ({courses.filter(c => filterOption === 'all' || c.status === filterOption).length})
          </button>
        ))}
      </div>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No courses found for the selected filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {filteredCourses.map(course => {
            const statusStyle = getStatusColor(course.status);
            return (
              <div key={course.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{course.title}</h3>
                    <p style={{ color: '#666', margin: '0 0 15px 0' }}>{course.description}</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', fontSize: '14px', color: '#555' }}>
                      <div><strong>Lecturer:</strong> {course.lecturerName}</div>
                      <div><strong>Category:</strong> {course.category}</div>
                      <div><strong>Duration:</strong> {course.duration}</div>
                      <div><strong>Max Students:</strong> {course.maxStudents}</div>
                      <div><strong>Enrolled:</strong> {course.enrollmentCount || 0}</div>
                      <div><strong>Created:</strong> {course.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
                    </div>
                  </div>

                  <div style={{ marginLeft: '20px', textAlign: 'center' }}>
                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      marginBottom: '15px',
                      textTransform: 'uppercase'
                    }}>
                      {course.status}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {course.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleCourseAction(course.id, 'approved')}
                            style={{
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleCourseAction(course.id, 'rejected')}
                            style={{
                              backgroundColor: '#dc3545',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      
                      {course.status === 'approved' && (
                        <button
                          onClick={() => handleCourseAction(course.id, 'rejected')}
                          style={{
                            backgroundColor: '#ffc107',
                            color: '#212529',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Deactivate
                        </button>
                      )}

                      {course.status === 'rejected' && (
                        <button
                          onClick={() => handleCourseAction(course.id, 'approved')}
                          style={{
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Reactivate
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
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

export default CourseManagement;