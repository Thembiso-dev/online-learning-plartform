import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

function CreateCourse() {
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    maxStudents: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError('You must be logged in to create a course');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Enhanced course data structure for admin management
      const newCourseData = {
        title: courseData.title.trim(),
        description: courseData.description.trim(),
        category: courseData.category.trim(),
        duration: courseData.duration.trim(),
        maxStudents: parseInt(courseData.maxStudents) || 0,
        lecturerId: currentUser.uid,
        lecturerName: currentUser.displayName || currentUser.email,
        lecturerEmail: currentUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'pending', // Admin will approve/reject
        studentsEnrolled: [],
        enrollmentCount: 0,
        isActive: false, // Admin activates after approval
        materials: [],
        assignments: [],
        announcements: []
      };

      await addDoc(collection(db, 'courses'), newCourseData);
      
      setSuccess('Course created successfully! It will appear in admin course management for approval.');
      
      // Reset form
      setCourseData({
        title: '',
        description: '',
        category: '',
        duration: '',
        maxStudents: ''
      });
      
    } catch (err) {
      console.error('Error creating course:', err);
      setError('Failed to create course: ' + err.message);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Create New Course</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Create a new course for students to enroll in.
      </p>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          border: '1px solid #ffcdd2'
        }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          color: '#2e7d32', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          border: '1px solid #c8e6c9'
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Course Title *
          </label>
          <input
            type="text"
            name="title"
            value={courseData.title}
            onChange={handleInputChange}
            required
            placeholder="Enter course title"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Category *
          </label>
          <select
            name="category"
            value={courseData.category}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">Select a category</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Engineering">Engineering</option>
            <option value="Business">Business</option>
            <option value="Arts">Arts</option>
            <option value="Languages">Languages</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Duration *
            </label>
            <input
              type="text"
              name="duration"
              value={courseData.duration}
              onChange={handleInputChange}
              required
              placeholder="e.g., 12 weeks, 3 months"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Max Students
            </label>
            <input
              type="number"
              name="maxStudents"
              value={courseData.maxStudents}
              onChange={handleInputChange}
              placeholder="e.g., 30"
              min="1"
              max="500"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={courseData.description}
            onChange={handleInputChange}
            required
            placeholder="Provide a detailed description of the course"
            rows="4"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {loading ? 'Creating Course...' : 'Create Course'}
        </button>
      </form>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '4px',
        fontSize: '14px',
        color: '#666'
      }}>
        <strong>Note:</strong> After creating your course, it will be sent to the admin for approval. 
        Once approved, students will be able to enroll in your course.
      </div>
    </div>
  );
}

export default CreateCourse;