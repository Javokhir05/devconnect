import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
import PasswordInput from "../components/PasswordInput";
import { field, label } from "../utils/ui";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form.username, form.email, form.password);
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
          <span className="text-accent-400">&gt;</span> register
        </h2>
        <p className="mt-1 text-sm text-slate-400">Join the developer community</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="username" className={label}>
          username
        </label>
        <input
          id="username"
          autoComplete="username"
          className={field}
          placeholder="john_dev"
          value={form.username}
          onChange={update("username")}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers and underscores only"
        />
        <p className="mt-1 text-xs text-slate-500">3 to 30 characters: letters, numbers, _</p>
      </div>

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
          value={form.email}
          onChange={update("email")}
          required
        />
      </div>

      <div>
        <label htmlFor="password" className={label}>
          password
        </label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          placeholder="at least 8 characters"
          minLength={8}
          value={form.password}
          onChange={update("password")}
        />
      </div>

      <button
        disabled={submitting}
        className="w-full rounded-lg bg-accent-500 py-2 font-medium text-white hover:bg-accent-400 disabled:opacity-50"
      >
        {submitting ? "creating account..." : "sign up"}
      </button>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link to="/login" className="text-accent-400 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}