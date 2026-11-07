import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Heart, MessageSquare, Share2, Trash2 } from "lucide-react";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/time";
import Avatar from "./Avatar";
import PostContent from "./PostContent";
import CommentSection from "./CommentSection";

export default function PostCard({ post, onDelete, defaultOpenComments = false }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post._count.likes);
  const [busy, setBusy] = useState(false);
  const [showComments, setShowComments] = useState(defaultOpenComments);
  const [commentCount, setCommentCount] = useState(post._count.comments);
  const [copied, setCopied] = useState(false);
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

  const share = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const action = "inline-flex items-center gap-1.5 rounded p-1 -m-1 hover:text-white";

  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <header className="mb-2 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar user={post.author} size="sm" />
          <div className="min-w-0 text-sm">
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
            aria-label="Delete post"
            title="Delete post"
            className="rounded p-1 text-slate-500 hover:text-red-400"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        )}
      </header>

      <PostContent text={post.content} />

      <footer className="mt-3 flex gap-6 text-sm text-slate-400">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
          className={`${action} ${liked ? "text-pink-400" : ""}`}
        >
          <Heart size={16} aria-hidden="true" className={liked ? "fill-current" : ""} />
          {likes}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          aria-expanded={showComments}
          aria-label="Comments"
          className={`${action} ${showComments ? "text-white" : ""}`}
        >
          <MessageSquare size={16} aria-hidden="true" />
          {commentCount}
        </button>
        <button onClick={share} aria-label="Copy link to post" className={action}>
          {copied ? (
            <Check size={16} aria-hidden="true" className="text-accent-400" />
          ) : (
            <Share2 size={16} aria-hidden="true" />
          )}
          {copied ? "copied" : "share"}
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