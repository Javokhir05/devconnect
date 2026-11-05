import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const terminalLines = [
  { prompt: true, text: "devconnect --join" },
  { text: "✔ share projects and posts" },
  { text: "✔ follow developers, find people by skill" },
  { text: "✔ a profile with your stack, GitHub and portfolio" },
  { dim: true, text: "… chat, notifications and jobs: coming soon" },
];

const features = [
  {
    cmd: "share",
    title: "Share what you build",
    text: "Post updates, ask questions and get feedback from other developers.",
  },
  {
    cmd: "connect",
    title: "Grow your network",
    text: "Follow developers and discover new people through search.",
  },
  {
    cmd: "showcase",
    title: "Show your skills",
    text: "One profile for your bio, skills, GitHub and portfolio.",
  },
];

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;

  return (
    <div className="min-h-screen bg-base text-slate-200">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="font-bold text-white">
          <span className="text-accent-400">$</span> <span className="cursor">devconnect</span>
        </span>
        <nav className="flex items-center gap-4 text-sm">
          <ThemeToggle />
          <Link to="/login" className="text-slate-300 hover:text-white">
            login
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-accent-500 px-3 py-1.5 font-medium text-white hover:bg-accent-400"
          >
            sign up
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm text-accent-400">{"// developer community"}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              Connect with developers worldwide
            </h1>
            <p className="mt-4 text-slate-400">
              Share projects, talk about code and find people who build the things you build.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-accent-500 px-5 py-2 font-medium text-white hover:bg-accent-400"
              >
                get started
              </Link>
              <Link
                to="/login"
                className="rounded-lg border border-white/10 px-5 py-2 text-slate-200 hover:bg-white/5"
              >
                log in
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-500/70" />
              <span className="ml-3 text-xs text-slate-500">~/devconnect</span>
            </div>
            <div className="space-y-1 overflow-x-auto p-4 text-sm">
              {terminalLines.map((l) => (
                <div key={l.text} className={l.dim ? "text-slate-500" : "text-slate-200"}>
                  {l.prompt && <span className="mr-2 text-accent-400">$</span>}
                  {l.text}
                </div>
              ))}
              <div className="text-accent-400">
                $ <span className="cursor" />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.cmd} className="rounded-xl border border-white/10 bg-white/3 p-5">
              <p className="text-sm text-accent-400">$ {f.cmd}</p>
              <h2 className="mt-2 font-semibold text-white">{f.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{f.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        built with React, Node.js, PostgreSQL and Prisma by Javokhirbek Ruziboev
      </footer>
    </div>
  );
}