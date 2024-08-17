import React, { useEffect, useState } from "react";
import { firestore } from "../firebase/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import CommentItem from "./CommentItem";
import styles from "./CommentList.module.css";

interface Comment {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  content: string;
  imageUrl?: string;
  createdAt?: any;
  reactionCount?: number;
}

const CommentList: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [sortBy, setSortBy] = useState("latest");
  const [page, setPage] = useState(0);
  const commentsPerPage = 8;
  const totalPages = Math.ceil(comments.length / commentsPerPage);

  useEffect(() => {
    const commentsQuery = query(
      collection(firestore, "comments"),
      orderBy(sortBy === "latest" ? "createdAt" : "reactionCount", "desc")
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];

      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [sortBy]);

  const handleSortByLatest = () => setSortBy("latest");
  const handleSortByPopularity = () => setSortBy("popularity");
  const handlePrevious = () => setPage((prev) => Math.max(prev - 1, 0));
  const handleNext = () =>
    setPage((prev) => Math.min(prev + 1, totalPages - 1));

  const paginatedComments = comments.slice(
    page * commentsPerPage,
    (page + 1) * commentsPerPage
  );

  return (
    <div>
      {paginatedComments && paginatedComments.length>0 && <div className={styles.sortButtons}>
        <button className={styles.sortButton} onClick={handleSortByLatest}>
          Sort by Latest
        </button>
        <button className={styles.sortButton} onClick={handleSortByPopularity}>
          Sort by Popularity
        </button>
      </div>}

      {paginatedComments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}

      {comments && comments.length>8 && <div className={styles.sortButtons}>
        <button
          className={`${styles.paginationButton} ${
            page === 0 ? "disabled" : ""
          }`}
          onClick={handlePrevious}
          disabled={page === 0}
        >
          Previous
        </button>
        <button
          className={`${styles.paginationButton} ${
            page === totalPages - 1 ? "disabled" : ""
          }`}
          onClick={handleNext}
          disabled={page === totalPages - 1}
        >
          Next
        </button>
      </div>}
    </div>
  );
};

export default CommentList;
