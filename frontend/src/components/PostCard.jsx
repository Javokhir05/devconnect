import { useState } from "react";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/time";
import CommentSection from "./CommentSection";
import { Link } from "react-router-dom";

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post._count.likes);
  const [busy, setBusy] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const isOwner = user.id === post.author.id;

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    // optimistic update: change the UI immediately, undo it if the request fails
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
    try {
      const res = next
        ? await api.put(`/posts/${post.id}/like`)
        : await api.delete(`/posts/${post.id}/like`);
      setLiked(res.data.liked);
      setLikes(res.data.likes);
    } catch {
      setLiked(!next);
      setLikes((n) => n + (next ? -1 : 1));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete(post.id);
    } catch (err) {
      alert(errorMessage(err));
    }
  };

  return (
    <article className="rounded-xl border border-white/10 bg-white/3 p-4">
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30 text-sm font-semibold uppercase text-white">
            {post.author.username[0]}
          </div>
          <div className="text-sm">
            <Link
              to={`/u/${post.author.username}`}
              className="font-medium text-white hover:underline"
            >
              {post.author.name || post.author.username}
            </Link>
            <span className="ml-2 text-slate-500">
              @{post.author.username} · {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="text-xs text-slate-500 hover:text-red-400"
          >
            Delete
          </button>
        )}
      </header>

      <p className="whitespace-pre-wrap wrap-break-word text-slate-200">
        {post.content}
      </p>

      <footer className="mt-3 flex gap-6 text-sm text-slate-400">
        <button
          onClick={toggleLike}
          className={liked ? "text-pink-400" : "hover:text-white"}
        >
          {liked ? "♥" : "♡"} {likes}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className={showComments ? "text-white" : "hover:text-white"}
        >
          💬 {commentCount}
        </button>
      </footer>

      {showComments && (
        <CommentSection
          postId={post.id}
          onCountChange={(delta) => setCommentCount((n) => n + delta)}
        />
      )}
    </article>
  );
}
