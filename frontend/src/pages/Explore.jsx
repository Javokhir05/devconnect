import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";
import UserCard from "../components/UserCard";

export default function Explore() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // search 300ms after the user stops typing; ignore responses that arrive late
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .get("/users", { params: { q: query.trim() } })
        .then((res) => {
          if (cancelled) return;
          setUsers(res.data.users);
          setNextCursor(res.data.nextCursor);
          setError("");
        })
        .catch((err) => !cancelled && setError(errorMessage(err)))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get("/users", { params: { q: query.trim(), cursor: nextCursor } });
      setUsers((prev) => [...prev, ...res.data.users]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Explore developers</h2>
        <p className="text-sm text-slate-400">Discover people in the community</p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or username..."
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-accent-500"
      />

      {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}
      {loading && <p className="text-slate-400">Searching...</p>}
      {!loading && users.length === 0 && !error && (
        <p className="text-slate-400">No developers found.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <UserCard key={u.id} user={u} />
        ))}
      </div>

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