import { useState } from "react";
import api, { errorMessage } from "../services/api";

export default function PostComposer({ onCreated }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/posts", { content });
      onCreated(res.data.post);
      setContent("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-white/3 p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="What's on your mind?"
        className="w-full resize-none bg-transparent text-white placeholder-slate-500 outline-none"
      />
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{content.length}/1000</span>
        <button
          disabled={submitting || !content.trim()}
          className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}