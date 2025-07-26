import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

function EnrollCourse() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Only fetch courses with status 'approved'
        const q = query(
          collection(db, 'courses'),
          where('status', '==', 'approved')
        );
        
        const querySnapshot = await getDocs(q);
        const coursesData = [];
        querySnapshot.forEach((doc) => {
          coursesData.push({ id: doc.id, ...doc.data() });
        });
        setCourses(coursesData);
      } catch (err) {
        setError('Failed to load courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      setError('');
      setSuccess('');
      
      await updateDoc(doc(db, 'courses', courseId), {
        studentsEnrolled: arrayUnion(currentUser.uid)
      });
      
      setSuccess('Enrolled successfully!');
      
      // Update local state to reflect enrollment
      setCourses(courses.map(course => 
        course.id === courseId 
          ? { 
              ...course, 
              studentsEnrolled: [...(course.studentsEnrolled || []), currentUser.uid] 
            } 
          : course
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <div>
      <h2>Available Courses</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <div className="course-list">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <button 
              onClick={() => handleEnroll(course.id)}
              disabled={course.studentsEnrolled?.includes(currentUser.uid)}
            >
              {course.studentsEnrolled?.includes(currentUser.uid) 
                ? 'Already Enrolled' 
                : 'Enroll'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EnrollCourse;