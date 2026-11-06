import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import SkillTags from "../components/SkillTags";
import Avatar from "../components/Avatar";
import { field } from "../utils/ui";

const TABS = ["posts", "about", "skills"];

const cleanUrl = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function EditForm({ profile, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    bio: profile.bio || "",
    headline: profile.headline || "",
    location: profile.location || "",
    githubUrl: profile.githubUrl || "",
    portfolioUrl: profile.portfolioUrl || "",
    skills: (profile.skills || []).join(", "),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const [p, s] = await Promise.all([
        api.patch("/users/me", {
          name: form.name,
          bio: form.bio,
          headline: form.headline,
          location: form.location,
          githubUrl: form.githubUrl,
          portfolioUrl: form.portfolioUrl,
        }),
        api.put("/users/me/skills", { skills }),
      ]);
      onSaved({ ...p.data.user, skills: s.data.skills });
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"
    >
      <h3 className="text-sm text-accent-400">$ edit-profile</h3>
      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">
          {error}
        </p>
      )}
      <input className={field} aria-label="Name" placeholder="Name" maxLength={60} value={form.name} onChange={update("name")} />
      <input className={field} aria-label="Headline" placeholder="Headline (e.g. Frontend Developer)" maxLength={60} value={form.headline} onChange={update("headline")} />
      <textarea className={field} aria-label="Bio" rows={3} placeholder="Bio" maxLength={300} value={form.bio} onChange={update("bio")} />
      <input className={field} aria-label="Location" placeholder="Location" maxLength={60} value={form.location} onChange={update("location")} />
      <input className={field} aria-label="Skills" placeholder="Skills, separated by commas (React, Node.js, SQL)" value={form.skills} onChange={update("skills")} />
      <input className={field} aria-label="GitHub URL" placeholder="GitHub URL (https://...)" value={form.githubUrl} onChange={update("githubUrl")} />
      <input className={field} aria-label="Portfolio URL" placeholder="Portfolio URL (https://...)" value={form.portfolioUrl} onChange={update("portfolioUrl")} />
      <div className="flex gap-2">
        <button disabled={saving} className="rounded-lg bg-accent-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-400 disabled:opacity-50">
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
  const [params, setParams] = useSearchParams();
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

  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "posts";
  const selectTab = (t) => setParams(t === "posts" ? {} : { tab: t }, { replace: true });

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
  const joined = new Date(profile.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const stats = [
    ["Posts", profile._count.posts],
    ["Followers", profile._count.followers],
    ["Following", profile._count.following],
  ];
  const card = "rounded-xl border border-white/10 bg-white/[0.03]";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* header */}
      <section className={`${card} overflow-hidden`}>
        <div aria-hidden="true" className="relative h-24 border-b border-white/10 sm:h-32">
          <div className="grid-bg absolute inset-0" />
          <div className="hero-glow absolute inset-0" />
          <span className="absolute bottom-2 right-3 text-xs text-slate-500">
            ~/{profile.username}
          </span>
        </div>

        <div className="px-4 pb-4 sm:px-6">
          <div className="-mt-10 flex items-end justify-between gap-3">
            <div className="rounded-full bg-base p-1">
              <Avatar user={profile} size="lg" />
            </div>
            <div className="pb-1">
              {isMe ? (
                !editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-slate-200 hover:bg-white/5"
                  >
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
                      : "bg-accent-500 text-white hover:bg-accent-400"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          </div>

          <h2 className="mt-3 break-words text-xl font-semibold text-white">
            {profile.name || profile.username}
          </h2>
          <p className="text-sm text-slate-500">@{profile.username}</p>
          {profile.headline && <p className="mt-1 text-sm text-accent-400">{profile.headline}</p>}
          {profile.bio && (
            <p className="mt-3 line-clamp-2 whitespace-pre-wrap break-words text-sm text-slate-300">
              {profile.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/10 pt-4 text-sm">
            {stats.map(([label, value]) => (
              <div key={label}>
                <span className="font-semibold text-white">{value}</span>{" "}
                <span className="text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {editing ? (
        <EditForm profile={profile} onSaved={handleSaved} onCancel={() => setEditing(false)} />
      ) : (
        <>
          {/* tabs */}
          <div role="tablist" aria-label="Profile sections" className="flex gap-1 border-b border-white/10">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                id={`tab-${t}`}
                aria-selected={tab === t}
                aria-controls="tabpanel"
                onClick={() => selectTab(t)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm ${
                  tab === t
                    ? "border-accent-500 text-accent-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                {t}
                {t === "posts" && (
                  <span className="ml-1.5 text-xs text-slate-500">{profile._count.posts}</span>
                )}
              </button>
            ))}
          </div>

          <div role="tabpanel" id="tabpanel" aria-labelledby={`tab-${tab}`} className="space-y-4">
            {tab === "posts" && (
              <>
                {posts.length === 0 && <p className="text-slate-400">No posts yet.</p>}
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onDelete={(id) => {
                      setPosts((prev) => prev.filter((p) => p.id !== id));
                      setProfile((p) => ({
                        ...p,
                        _count: { ...p._count, posts: p._count.posts - 1 },
                      }));
                    }}
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
              </>
            )}

            {tab === "about" && (
              <div className={`${card} space-y-4 p-5 text-sm`}>
                <p className="whitespace-pre-wrap break-words text-slate-300">
                  {profile.bio || <span className="text-slate-500">No bio yet.</span>}
                </p>
                <dl className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2">
                  <dt className="text-slate-500">location</dt>
                  <dd className="break-words text-slate-300">{profile.location || "—"}</dd>
                  <dt className="text-slate-500">joined</dt>
                  <dd className="text-slate-300">{joined}</dd>
                  <dt className="text-slate-500">github</dt>
                  <dd>
                    {profile.githubUrl ? (
                      <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="break-all text-accent-400 hover:underline">
                        {cleanUrl(profile.githubUrl)}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </dd>
                  <dt className="text-slate-500">portfolio</dt>
                  <dd>
                    {profile.portfolioUrl ? (
                      <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="break-all text-accent-400 hover:underline">
                        {cleanUrl(profile.portfolioUrl)}
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </dd>
                </dl>
              </div>
            )}

            {tab === "skills" && (
              <div className={`${card} p-5`}>
                {profile.skills?.length ? (
                  <SkillTags skills={profile.skills} />
                ) : (
                  <p className="text-sm text-slate-400">
                    No skills added yet.{" "}
                    {isMe && (
                      <button onClick={() => setEditing(true)} className="text-accent-400 hover:underline">
                        Add some
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}