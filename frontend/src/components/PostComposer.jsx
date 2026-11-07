import { useState } from "react";
import api, { errorMessage } from "../services/api";
import { Code } from "lucide-react";

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

  const insertCode = () =>
    setContent((c) => (c && !c.endsWith("\n") ? c + "\n" : c) + "```\n\n```");

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/3 p-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="What's on your mind?"
        className="w-full resize-none bg-transparent text-white placeholder-slate-500 outline-none"
      />
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={insertCode}
            className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5"
          >
            <Code size={14} aria-hidden="true" />
            code
          </button>
          <span className="text-xs text-slate-500">{content.length}/1000</span>
        </div>
        <button
          disabled={submitting || !content.trim()}
          className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-400 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
