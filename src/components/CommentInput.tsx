import React, { useState } from "react";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";

import { useAuth } from "../context/AuthContext";
import { firestore, storage } from "../firebase/firebaseConfig";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import styles from "./CommentInput.module.css";

interface CommentInputProps {
  onCommentPosted: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ onCommentPosted }) => {
  const { user } = useAuth();
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const handlePostComment = async () => {
    if (!user) return;
    
    const content = editorState.getCurrentContent();
    const contentHtml = draftToHtml(convertToRaw(content));

    await addDoc(collection(firestore, "comments"), {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      content: contentHtml,
      createdAt: serverTimestamp(),
      reactions: 0, 
    });

    onCommentPosted();
    setEditorState(EditorState.createEmpty());
  };

  const uploadImageCallback = async (file: File) => {
    const imageRef = ref(storage, `images/${file.name}`);
    await uploadBytes(imageRef, file);
    const imageUrl = await getDownloadURL(imageRef);
    return { data: { link: imageUrl } };
  };

  return (
    <div className={styles.container}>
      <div className={styles.editorContainer}>
        <Editor
          editorState={editorState}
          onEditorStateChange={setEditorState}
          toolbar={{
            image: {
              uploadCallback: uploadImageCallback,
              previewImage: true,
              alt: { present: true, mandatory: false },
              alignmentEnabled: false, 
            },
          }}
          editorStyle={{ textAlign: "left" }}
        />
      </div>
      <button className={styles.button} onClick={handlePostComment}>
        Post Comment
      </button>
    </div>
  );
};

export default CommentInput;
