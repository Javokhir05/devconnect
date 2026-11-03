import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const input =
    "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-slate-500 outline-none focus:border-indigo-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/3 p-6">
      <h2 className="text-xl font-semibold text-white">Welcome back</h2>
      {error && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">{error}</p>}
      <input className={input} type="email" placeholder="Email address" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <input className={input} type="password" placeholder="Password" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      <button disabled={submitting}
        className="w-full rounded-lg bg-indigo-500 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-50">
        {submitting ? "Signing in..." : "Sign in"}
      </button>
      <p className="text-center text-sm text-slate-400">
        No account? <Link to="/register" className="text-indigo-400">Sign up</Link>
      </p>
    </form>
  );
}