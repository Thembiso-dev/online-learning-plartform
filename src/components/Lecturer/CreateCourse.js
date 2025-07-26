import { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

function CreateCourse() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    duration: '',
    maxStudents: '',
    requirements: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: 'Title and description are required.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const courseData = {
        ...formData,
        lecturerId: currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        studentsEnrolled: [],
        status: 'pending', // All new courses start as pending approval
        enrollmentCount: 0
      };

      await addDoc(collection(db, 'courses'), courseData);
      
      setMessage({ 
        type: 'success', 
        text: 'Course created successfully! It is now pending admin approval. You will be notified once it\'s reviewed.' 
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        duration: '',
        maxStudents: '',
        requirements: ''
      });
      
    } catch (error) {
      console.error('Error creating course:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to create course. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Create New Course</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Fill out the form below to create a new course. All courses require admin approval before becoming available to students.
      </p>
      
      {message.text && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Course Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter course title"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Course Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="Describe what students will learn in this course"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            >
              <option value="">Select a category</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Business">Business</option>
              <option value="Arts">Arts</option>
              <option value="Language">Language</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Duration
            </label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
              placeholder="e.g., 8 weeks, 3 months"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Maximum Students
          </label>
          <input
            type="number"
            name="maxStudents"
            value={formData.maxStudents}
            onChange={handleChange}
            min="1"
            style={{
              width: '200px',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
            placeholder="Enter max number"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Prerequisites/Requirements
          </label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows="3"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="List any prerequisites or requirements for this course"
          />
        </div>

        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>📋 Course Approval Process</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
            <li>After submission, your course will be marked as "Pending" approval</li>
            <li>An admin will review your course details</li>
            <li>You'll be notified when your course is approved or if changes are needed</li>
            <li>Approved courses become available to students for enrollment</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            padding: '12px 30px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            justifySelf: 'start'
          }}
        >
          {loading ? 'Creating Course...' : 'Create Course for Approval'}
        </button>
      </form>
    </div>
  );
}

export default CreateCourse;