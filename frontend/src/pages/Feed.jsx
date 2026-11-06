import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import PostComposer from "../components/PostComposer";
import PostCard from "../components/PostCard";
import WhoToFollow from "../components/WhoToFollow";
import { field } from "../utils/ui";

const PAGE_SIZE = 10;

export default function Feed() {
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const q = query.trim();

  // search 300ms after typing stops; ignore responses that arrive late
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(
      () => {
        api
          .get("/posts", { params: { limit: PAGE_SIZE, q: q || undefined } })
          .then((res) => {
            if (cancelled) return;
            setPosts(res.data.posts);
            setNextCursor(res.data.nextCursor);
            setError("");
          })
          .catch((err) => !cancelled && setError(errorMessage(err)))
          .finally(() => !cancelled && setLoading(false));
      },
      q ? 300 : 0
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get("/posts", {
        params: { limit: PAGE_SIZE, cursor: nextCursor, q: q || undefined },
      });
      setPosts((prev) => [...prev, ...res.data.posts]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="min-w-0 space-y-4">
        <div>
          <label htmlFor="post-search" className="sr-only">
            Search posts
          </label>
          <input
            id="post-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="$ grep posts..."
            className={field}
          />
        </div>

        {!q && <PostComposer onCreated={(post) => setPosts((prev) => [post, ...prev])} />}

        {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}
        {loading && <p className="text-slate-400">{q ? "Searching..." : "Loading posts..."}</p>}
        {!loading && posts.length === 0 && !error && (
          <p className="text-slate-400">
            {q ? `No posts match "${q}".` : "No posts yet. Be the first to post!"}
          </p>
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

      <aside className="hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <WhoToFollow />
        </div>
      </aside>
    </div>
  );
}