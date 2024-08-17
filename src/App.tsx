import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CommentInput from "./components/CommentInput";
import CommentList from "./components/CommentList";
import styles from "./components/CommentInput.module.css";


const App = () => {
  const { signInWithGoogle, user } = useAuth();
  const handleCommentPosted = () => {
    console.log("A comment was posted!");
  };

  return (
    <div className={styles.wrapper}>
      {user ? (
        <>
          <CommentInput onCommentPosted={handleCommentPosted} />
          <CommentList />
        </>
      ) : (
        <button onClick={signInWithGoogle}>Sign in with Google</button>
      )}
    </div>
  );
};

const Root = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default Root;
