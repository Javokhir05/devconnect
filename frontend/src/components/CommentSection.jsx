import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { timeAgo } from "../utils/time";

export default function CommentSection({ postId, onCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/posts/${postId}/comments`)
      .then((res) => setComments(res.data.comments))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content });
      setComments((prev) => [...prev, res.data.comment]);
      onCountChange(1);
      setContent("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/comments/${id}`);
      setComments((prev) => prev.filter((c) => c.id !== id));
      onCountChange(-1);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
      {loading && <p className="text-sm text-slate-500">Loading comments...</p>}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-slate-500">No comments yet.</p>
      )}

      {comments.map((c) => (
        <div key={c.id} className="text-sm">
          <div className="flex items-center justify-between">
            <span>
              <span className="font-medium text-white">{c.user.name || c.user.username}</span>
              <span className="ml-2 text-slate-500">
                @{c.user.username} · {timeAgo(c.createdAt)}
              </span>
            </span>
            {c.user.id === user.id && (
              <button
                onClick={() => handleDelete(c.id)}
                className="text-xs text-slate-500 hover:text-red-400"
              >
                Delete
              </button>
            )}
          </div>
          <p className="whitespace-pre-wrap wrap-break-word text-slate-300">{c.content}</p>
        </div>
      ))}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={500}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
        />
        <button
          disabled={submitting || !content.trim()}
          className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}