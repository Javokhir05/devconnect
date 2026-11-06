import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function WhoToFollow() {
  const { user: me } = useAuth();
  const [people, setPeople] = useState([]);
  const [followed, setFollowed] = useState({});

  useEffect(() => {
    api
      .get("/users", { params: { limit: 12 } })
      .then((res) =>
        setPeople(res.data.users.filter((u) => u.id !== me.id && !u.isFollowing).slice(0, 4))
      )
      .catch(() => {});
  }, [me.id]);

  const follow = async (username) => {
    setFollowed((f) => ({ ...f, [username]: true }));
    try {
      await api.put(`/users/${username}/follow`);
    } catch {
      setFollowed((f) => ({ ...f, [username]: false }));
    }
  };

  if (people.length === 0) return null;

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <h2 className="mb-3 text-sm text-accent-400">$ who-to-follow</h2>
      <ul className="space-y-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-2">
            <Avatar user={p} size="sm" />
            <Link to={`/u/${p.username}`} className="min-w-0 flex-1 text-sm">
              <span className="block truncate text-white hover:underline">{p.name || p.username}</span>
              <span className="block truncate text-xs text-slate-500">@{p.username}</span>
            </Link>
            <button
              onClick={() => follow(p.username)}
              disabled={followed[p.username]}
              className="rounded border border-accent-500/50 px-2 py-0.5 text-xs text-accent-400 hover:bg-accent-500/10 disabled:opacity-60"
            >
              {followed[p.username] ? "following" : "follow"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}