import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';

function StudentMyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      const q = query(
        collection(db, 'courses'),
        where('studentsEnrolled', 'array-contains', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const coursesData = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, ...doc.data() });
      });
      setCourses(coursesData);
      setLoading(false);
    };

    fetchCourses();
  }, [currentUser]);

  if (loading) return <div>Loading your courses...</div>;

  return (
    <div>
      <h2>My Enrolled Courses</h2>
      {courses.length === 0 ? (
        <p>You haven't enrolled in any courses yet.</p>
      ) : (
        <div className="course-list">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <p>Lecturer: {course.lecturerId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentMyCourses;