import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import PasswordInput from "../components/PasswordInput";
import { field, label } from "../utils/ui";

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
      navigate("/feed");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-white">
          <span className="text-accent-400">&gt;</span> login
        </h2>
        <p className="mt-1 text-sm text-slate-400">Sign in to your account</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="email" className={label}>
          email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={field}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className={label}>
          password
        </label>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        disabled={submitting}
        className="w-full rounded-lg bg-accent-500 py-2 font-medium text-white hover:bg-accent-400 disabled:opacity-50"
      >
        {submitting ? "signing in..." : "sign in"}
      </button>

      <p className="text-center text-sm text-slate-400">
        No account?{" "}
        <Link to="/register" className="text-accent-400 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}