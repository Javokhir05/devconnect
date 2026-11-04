import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";

const input =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500";

function EditForm({ profile, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    location: profile.location || "",
    githubUrl: profile.githubUrl || "",
    portfolioUrl: profile.portfolioUrl || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await api.patch("/users/me", form);
      onSaved(res.data.user);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}
      <input className={input} placeholder="Name" maxLength={60} value={form.name} onChange={update("name")} />
      <textarea className={input} rows={3} placeholder="Bio" maxLength={300} value={form.bio} onChange={update("bio")} />
      <input className={input} placeholder="Location" maxLength={60} value={form.location} onChange={update("location")} />
      <input className={input} placeholder="GitHub URL (https://...)" value={form.githubUrl} onChange={update("githubUrl")} />
      <input className={input} placeholder="Portfolio URL (https://...)" value={form.portfolioUrl} onChange={update("portfolioUrl")} />
      <div className="flex gap-2">
        <button disabled={saving} className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-50">
          {saving ? "Saving..." : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/5">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { username } = useParams();
  const { user: me, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts, setPosts] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setError("");
    setEditing(false);
    Promise.all([api.get(`/users/${username}`), api.get(`/users/${username}/posts`)])
      .then(([p, ps]) => {
        setProfile(p.data.user);
        setIsFollowing(p.data.isFollowing);
        setPosts(ps.data.posts);
        setNextCursor(ps.data.nextCursor);
      })
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
        else setError(errorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [username]);

  const toggleFollow = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = isFollowing
        ? await api.delete(`/users/${username}/follow`)
        : await api.put(`/users/${username}/follow`);
      setIsFollowing(res.data.following);
      setProfile((p) => ({ ...p, _count: { ...p._count, followers: res.data.followers } }));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await api.get(`/users/${username}/posts`, { params: { cursor: nextCursor } });
      setPosts((prev) => [...prev, ...res.data.posts]);
      setNextCursor(res.data.nextCursor);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSaved = (updated) => {
    setProfile((p) => ({ ...p, ...updated }));
    updateUser(updated);
    setEditing(false);
  };

  if (loading) return <p className="text-slate-400">Loading profile...</p>;
  if (notFound) return <p className="text-slate-400">User not found.</p>;
  if (!profile) return <p className="text-red-400">{error}</p>;

  const isMe = me.username === profile.username;
  const stats = [
    ["Posts", profile._count.posts],
    ["Followers", profile._count.followers],
    ["Following", profile._count.following],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-xl border border-white/10 bg-white/3 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-2xl font-semibold uppercase text-white">
              {profile.username[0]}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{profile.name || profile.username}</h2>
              <p className="text-sm text-slate-500">@{profile.username}</p>
            </div>
          </div>
          {isMe ? (
            !editing && (
              <button onClick={() => setEditing(true)} className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/5">
                Edit profile
              </button>
            )
          ) : (
            <button
              onClick={toggleFollow}
              disabled={busy}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50 ${
                isFollowing
                  ? "border border-white/10 text-slate-200 hover:bg-white/5"
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
              }`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-4">
            <EditForm profile={profile} onSaved={handleSaved} onCancel={() => setEditing(false)} />
          </div>
        ) : (
          <div className="mt-4 space-y-2 text-sm">
            {profile.bio && <p className="whitespace-pre-wrap text-slate-300">{profile.bio}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400">
              {profile.location && <span>📍 {profile.location}</span>}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                  GitHub
                </a>
              )}
              {profile.portfolioUrl && (
                <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                  Portfolio
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 flex gap-6 border-t border-white/10 pt-4 text-sm">
          {stats.map(([label, value]) => (
            <div key={label}>
              <span className="font-semibold text-white">{value}</span>{" "}
              <span className="text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}
      {posts.length === 0 && <p className="text-slate-400">No posts yet.</p>}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onDelete={(id) => {
            setPosts((prev) => prev.filter((p) => p.id !== id));
            setProfile((p) => ({ ...p, _count: { ...p._count, posts: p._count.posts - 1 } }));
          }}
        />
      ))}

      {nextCursor && (
        <button onClick={loadMore} disabled={loadingMore} className="w-full rounded-lg border border-white/10 py-2 text-sm text-slate-300 hover:bg-white/5 disabled:opacity-50">
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}