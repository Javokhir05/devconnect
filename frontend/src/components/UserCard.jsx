import { useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function UserCard({ user }) {
  const { user: me } = useAuth();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [followers, setFollowers] = useState(user._count.followers);
  const [busy, setBusy] = useState(false);

  const toggleFollow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = isFollowing
        ? await api.delete(`/users/${user.username}/follow`)
        : await api.put(`/users/${user.username}/follow`);
      setIsFollowing(res.data.following);
      setFollowers(res.data.followers);
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/3 p-4 text-center">
      <Link to={`/u/${user.username}`} className="flex flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/30 text-xl font-semibold uppercase text-white">
          {user.username[0]}
        </div>
        <p className="mt-2 font-medium text-white hover:underline">{user.name || user.username}</p>
        <p className="text-sm text-slate-500">@{user.username}</p>
      </Link>

      {user.bio && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{user.bio}</p>}
      {user.location && <p className="mt-1 text-xs text-slate-500">📍 {user.location}</p>}
      <p className="mt-2 text-xs text-slate-500">
        {followers} {followers === 1 ? "follower" : "followers"}
      </p>

      {user.id !== me.id && (
        <button
          onClick={toggleFollow}
          disabled={busy}
          className={`mt-3 w-full rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
            isFollowing
              ? "border border-white/10 text-slate-200 hover:bg-white/5"
              : "bg-indigo-500 text-white hover:bg-indigo-400"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}