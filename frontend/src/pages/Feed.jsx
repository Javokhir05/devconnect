import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";

const PAGE_SIZE = 10;

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/posts", { params: { limit: PAGE_SIZE } })
      .then((res) => {
        setPosts(res.data.posts);
        setNextCursor(res.data.nextCursor);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get("/posts", { params: { limit: PAGE_SIZE, cursor: nextCursor } });
      setPosts((prev) => [...prev, ...res.data.posts]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PostComposer onCreated={(post) => setPosts((prev) => [post, ...prev])} />

      {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}
      {loading && <p className="text-slate-400">Loading posts...</p>}
      {!loading && posts.length === 0 && !error && (
        <p className="text-slate-400">No posts yet. Be the first to post!</p>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
        />
      ))}

      {nextCursor && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="w-full rounded-lg border border-white/10 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}