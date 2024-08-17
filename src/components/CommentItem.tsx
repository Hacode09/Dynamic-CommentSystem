import React, { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import styles from "./CommentItem.module.css";
import { firestore } from "../firebase/firebaseConfig";
import {
  updateDoc,
  doc,
  arrayUnion,
  setDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";

interface Reaction {
  emoji: string;
  count: number;
  userId: string;
}

interface Reply {
  id: string;
  uid: string;
  commentId: string;
  displayName: string;
  content: string;
  createdAt: any;
  photoURL: string;
  isReply?: boolean;
  reactions?: Reaction[];
}

interface Comment {
  id: string;
  uid: string;
  displayName: string;
  photoURL: string;
  content: string;
  imageUrl?: string;
  createdAt?: any;
  reactions?: Reaction[];
  replies?: Reply[];
  repliesCount?: number;
  isReply?: boolean;
}

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const { user } = useAuth();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replies, setReplies] = useState<any[]>([]);
  const [localReactions, setLocalReactions] = useState(comment.reactions || []);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const userId = user?.uid!; 

  useEffect(() => {
    const loadReplies = async () => {
      const fetchedReplies = await fetchReplies(comment.id);
      setReplies(fetchedReplies);
    };
    loadReplies();
  }, [comment.id, isReplying]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target as Node) &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setIsEmojiPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchReplies = async (commentId: string) => {
    const repliesSnapshot = await getDocs(
      query(
        collection(firestore, "replies"),
        where("commentId", "==", commentId)
      )
    );
    const repliesData = repliesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return repliesData;
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleReply = () => {
    setIsReplying((prev) => !prev);
  };

  const handlePostReply = async () => {
    if (!replyContent.trim()) return;

    const reply = {
      id: uuidv4(),
      commentId: comment.id,
      uid: comment.uid,
      displayName: comment.displayName,
      photoURL: comment.photoURL,
      content: replyContent,
      isReply: true,
      createdAt: new Date(),
    };

    const replyRef = doc(firestore, "replies", reply.id);
    await setDoc(replyRef, reply);

    const commentRef = doc(firestore, "comments", reply.commentId);

    try {
      await updateDoc(commentRef, {
        replies: arrayUnion(reply.id),
        repliesCount: (comment.repliesCount || 0) + 1,
      });
    } catch (error) {
      console.error("Error updating comment document:", error);
    }

    setReplyContent("");
    setIsReplying(false);
  };

  const handleReact = async (emoji: string) => {
    const targetRef = comment.hasOwnProperty("commentId")
      ? doc(firestore, "replies", comment.id)
      : doc(firestore, "comments", comment.id);

    try {
      const existingReactionIndex = localReactions.findIndex(
        (reaction) => reaction.userId === userId
      );

      let updatedReactions;
      if (existingReactionIndex > -1) {
        const existingReaction = localReactions[existingReactionIndex];

        if (existingReaction.emoji === emoji) {
          return;
        } else {
          updatedReactions = [
            ...localReactions.slice(0, existingReactionIndex),
            { ...existingReaction, emoji },
            ...localReactions.slice(existingReactionIndex + 1),
          ];
        }
      } else {
        updatedReactions = [...localReactions, { emoji, count: 1, userId }];
      }

      setLocalReactions(updatedReactions);

      await updateDoc(targetRef, { reactions: updatedReactions });
    } catch (error) {
      console.error("Error updating reactions:", error);
    }
  };

  const renderReactions = (reactions: Reaction[] = []) => {
    const reactionCountMap: { [emoji: string]: number } = reactions.reduce(
      (acc, reaction) => {
        if (reaction.emoji in acc) {
          acc[reaction.emoji] += reaction.count;
        } else {
          acc[reaction.emoji] = reaction.count;
        }
        return acc;
      },
      {} as { [emoji: string]: number }
    );

    return Object.entries(reactionCountMap).map(([emoji, count], index) => (
      <React.Fragment key={index}>
        <button onClick={() => handleReact(emoji)}>
          {emoji} {count}
        </button>
        {index + 1 === Object.entries(reactionCountMap).length && (
          <div className={styles.rightBorder}></div>
        )}
      </React.Fragment>
    ));
  };

  const renderEmoji = () => {
    let reaction;

    const existingReactionIndex = localReactions.findIndex(
      (reaction) => reaction.userId === userId
    );

    if (existingReactionIndex > -1) {
      reaction = localReactions[existingReactionIndex];

      return reaction.emoji;
    }

    return (
      <img
        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTciIGhlaWdodD0iMTciIHZpZXdCb3g9IjE1LjcyOSAyMi4wODIgMTcgMTciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI5LjcwOCAyNS4xMDRjLTMuMDIxLTMuMDIyLTcuOTM3LTMuMDIyLTEwLjk1OCAwLTMuMDIxIDMuMDItMy4wMiA3LjkzNiAwIDEwLjk1OCAzLjAyMSAzLjAyIDcuOTM3IDMuMDIgMTAuOTU4LS4wMDEgMy4wMi0zLjAyMSAzLjAyLTcuOTM2IDAtMTAuOTU3em0tLjg0NSAxMC4xMTJhNi41NiA2LjU2IDAgMCAxLTkuMjY4IDAgNi41NiA2LjU2IDAgMCAxIDAtOS4yNjcgNi41NiA2LjU2IDAgMCAxIDkuMjY4IDAgNi41NiA2LjU2IDAgMCAxIDAgOS4yNjd6bS03LjUyNC02LjczYS45MDYuOTA2IDAgMSAxIDEuODExIDAgLjkwNi45MDYgMCAwIDEtMS44MTEgMHptNC4xMDYgMGEuOTA2LjkwNiAwIDEgMSAxLjgxMiAwIC45MDYuOTA2IDAgMCAxLTEuODEyIDB6bTIuMTQxIDMuNzA4Yy0uNTYxIDEuMjk4LTEuODc1IDIuMTM3LTMuMzQ4IDIuMTM3LTEuNTA1IDAtMi44MjctLjg0My0zLjM2OS0yLjE0N2EuNDM4LjQzOCAwIDAgMSAuODEtLjMzNmMuNDA1Ljk3NiAxLjQxIDEuNjA3IDIuNTU5IDEuNjA3IDEuMTIzIDAgMi4xMjEtLjYzMSAyLjU0NC0xLjYwOGEuNDM4LjQzOCAwIDAgMSAuODA0LjM0N3oiLz48L3N2Zz4="
        alt="emoji"
      />
    );
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerOpen((prev) => !prev);
  };

  return (
    <div className={styles.commentItem}>
      <img
        className={styles.profileImage}
        src={comment.photoURL}
        alt="profile"
      />
      <div className={styles.content}>
        <span>{comment.displayName}</span>
        <p
          className={`${styles.commentText} ${
            isExpanded ? styles.expanded : ""
          }`}
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
        {comment.content.length > 100 && (
          <button onClick={handleToggleExpand}>
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}

        <div className={styles.reactions}>
          <div
            className={styles.emojiPicker}
            onClick={toggleEmojiPicker}
            ref={emojiPickerRef}
          >
            {renderEmoji()}
          </div>

          <div className={styles.commonRightBorder}></div>

          {renderReactions(localReactions)}

          <button onClick={handleReply}>Reply</button>
          <span className={styles.timestamp}>
            {moment(comment.createdAt?.seconds * 1000).fromNow()}
          </span>
        </div>

        {isEmojiPickerOpen && (
          <div className={styles.reactions} ref={reactionsRef}>
            {["👍", "❤️", "😂", "🎉", "😢", "😡"].map((emoji) => (
              <button key={emoji} onClick={() => handleReact(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        {isReplying && (
          <div className={styles.replyInput}>
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
            />
            <button onClick={handlePostReply}>Send</button>
          </div>
        )}

        {replies && replies.length > 0 && (
          <div className={styles.replies}>
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
