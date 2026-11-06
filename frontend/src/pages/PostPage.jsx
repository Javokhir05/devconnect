import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../services/api";
import PostCard from "../components/PostCard";

export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [state, setState] = useState("loading"); // loading | ok | missing | error
  const [error, setError] = useState("");

  useEffect(() => {
    setState("loading");
    api
      .get(`/posts/${id}`)
      .then((res) => {
        setPost(res.data.post);
        setState("ok");
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 404 || status === 400) setState("missing");
        else {
          setError(errorMessage(err));
          setState("error");
        }
      });
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link to="/feed" className="text-sm text-slate-400 hover:text-white">
        ← back to feed
      </Link>
      {state === "loading" && <p className="text-slate-400">Loading post...</p>}
      {state === "missing" && <p className="text-slate-400">Post not found.</p>}
      {state === "error" && <p className="text-red-400">{error}</p>}
      {state === "ok" && (
        <PostCard post={post} defaultOpenComments onDelete={() => navigate("/feed")} />
      )}
    </div>
  );
}