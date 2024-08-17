import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { auth } from "../firebase/firebaseConfig";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  signInWithGoogle: () => Promise<UserCredential>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential: UserCredential = await signInWithPopup(
        auth,
        provider
      );
      return userCredential; 
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error; 
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
