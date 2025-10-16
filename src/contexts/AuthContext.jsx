import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("User data from Firestore:", userData);
            
            // Handle both 'role' and 'userRole' field names
            const role = userData.role || userData.userRole || 'student';
            console.log("Determined role:", role);
            setUserRole(role);
            
            // If user has old 'userRole' field, update to 'role' for consistency
            if (userData.userRole && !userData.role) {
              console.log("Updating user document to use 'role' field...");
              await setDoc(doc(db, 'users', user.uid), {
                ...userData,
                role: userData.userRole
              }, { merge: true });
            }
          } else {
            // Create user document if it doesn't exist
            console.log("Creating new user document...");
            await setDoc(doc(db, 'users', user.uid), {
              email: user.email,
              displayName: user.displayName || user.email,
              role: 'student',
              createdAt: new Date(),
              uid: user.uid
            });
            setUserRole('student');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setUserRole('student');
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}