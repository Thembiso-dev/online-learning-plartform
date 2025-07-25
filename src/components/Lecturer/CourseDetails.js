// CourseDetails.js
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

function CourseDetails() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  const toolBtnStyle = {
    padding: '10px',
    fontSize: '13px',
    backgroundColor: '#f1f1f1',
    border: '1px solid #ccc',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'center'
  };

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error('Course not found');
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  if (loading) return <p>Loading course...</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>{course.title}</h2>
      <p>{course.description}</p>

      <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <div><strong>Category:</strong> {course.category}</div>
        <div><strong>Duration:</strong> {course.duration}</div>
        <div><strong>Max Students:</strong> {course.maxStudents}</div>
        <div><strong>Enrolled:</strong> {course.enrollmentCount || 0}</div>
        <div><strong>Status:</strong> {course.status}</div>
        <div><strong>Created:</strong> {course.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</div>
      </div>

      <hr style={{ margin: '20px 0' }} />

      <h3>📂 Course Tools</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
        <button style={toolBtnStyle}>📤 Upload Video</button>
        <button style={toolBtnStyle}>📝 Add Lecture Notes</button>
        <button style={toolBtnStyle}>🖼️ Upload Image</button>
        <button style={toolBtnStyle}>📁 Upload File</button>
        <button style={toolBtnStyle}>📚 Add Assignment</button>
        <button style={toolBtnStyle}>🧾 Grade Submissions</button>
      </div>
    </div>
  );
}

export default CourseDetails;
