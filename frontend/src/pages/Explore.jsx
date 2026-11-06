import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import UserCard from "../components/UserCard";
import { field } from "../utils/ui";

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const skill = params.get("skill") || "";
  const setSkill = (s) => setParams(s ? { skill: s } : {}, { replace: true });

  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const q = query.trim();

  useEffect(() => {
    api
      .get("/skills/popular")
      .then((res) => setPopular(res.data.skills))
      .catch(() => {});
  }, []);

  // search 300ms after typing stops; ignore responses that arrive late
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(
      () => {
        api
          .get("/users", { params: { q: q || undefined, skill: skill || undefined } })
          .then((res) => {
            if (cancelled) return;
            setUsers(res.data.users);
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
  }, [q, skill]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get("/users", {
        params: { q: q || undefined, skill: skill || undefined, cursor: nextCursor },
      });
      setUsers((prev) => [...prev, ...res.data.users]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  // keep the selected skill visible even if it isn't among the popular ones
  const chips =
    skill && !popular.some((p) => p.toLowerCase() === skill.toLowerCase())
      ? [skill, ...popular]
      : popular;

  const chip = (active) =>
    `rounded border px-2.5 py-1 text-xs ${
      active
        ? "border-accent-500 bg-accent-500/25 text-accent-400"
        : "border-white/10 text-slate-400 hover:text-white"
    }`;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">
          <span className="text-accent-400">&gt;</span> explore
        </h2>
        <p className="text-sm text-slate-400">Find developers by name, role or skill</p>
      </div>

      <div>
        <label htmlFor="explore-search" className="sr-only">
          Search developers
        </label>
        <input
          id="explore-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="$ find --name --role --skill"
          className={field}
        />
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by skill">
          <button onClick={() => setSkill("")} aria-pressed={!skill} className={chip(!skill)}>
            all
          </button>
          {chips.map((s) => {
            const active = skill.toLowerCase() === s.toLowerCase();
            return (
              <button
                key={s}
                onClick={() => setSkill(active ? "" : s)}
                aria-pressed={active}
                className={chip(active)}
              >
                #{s}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {loading && <p className="text-slate-400">Searching...</p>}
      {!loading && !error && (
        <p className="text-xs text-slate-500">
          {users.length === 0
            ? "No developers found."
            : `${users.length}${nextCursor ? "+" : ""} ${users.length === 1 && !nextCursor ? "developer" : "developers"}${skill ? ` with #${skill}` : ""}`}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((u) => (
          <UserCard key={u.id} user={u} onSkillClick={setSkill} activeSkill={skill} />
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