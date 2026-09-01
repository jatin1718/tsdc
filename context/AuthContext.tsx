// Save this file as: context/AuthContext.tsx  (REPLACES current file)
"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Proper shape for what's stored in a users/{uid} Firestore document —
// replaces the "any" that was here before. Now if anyone types
// userData.rol (typo) instead of userData.role, TypeScript catches it
// immediately instead of silently returning undefined at runtime.
interface UserData {
  name: string;
  email: string;
  role: "admin" | "teammate";
}

interface AuthContextValue {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  userData: null,
  loading: true,
  logOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const logOut = () => signOut(auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          } else {
            console.error("No user profile found for authenticated user.");
            setUserData(null);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          setUserData(null);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, logOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);