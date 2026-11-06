import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

const CMD = "devconnect --join";
const OUTPUT = [
  "✔ share projects and posts",
  "✔ follow developers, find people by skill",
  "✔ one profile for your stack, GitHub and portfolio",
  "… chat, notifications and jobs: coming soon",
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

const steps = [
  { n: "01", title: "Create your profile", text: "Add your bio, skills and links in a minute." },
  { n: "02", title: "Post and follow", text: "Share your work and follow developers you like." },
  { n: "03", title: "Find your people", text: "Search the community by name, username or skill." },
];

const stack = ["React", "Node.js", "PostgreSQL", "Prisma", "Tailwind"];

function TerminalCard() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [chars, setChars] = useState(reduce ? CMD.length : 0);
  const [visible, setVisible] = useState(reduce ? OUTPUT.length : 0);

  // type the command letter by letter, then reveal the output lines one by one
  useEffect(() => {
    if (reduce) return;
    let timer;
    if (chars < CMD.length) {
      timer = setTimeout(() => setChars(chars + 1), 70);
    } else if (visible < OUTPUT.length) {
      timer = setTimeout(() => setVisible(visible + 1), 450);
    }
    return () => clearTimeout(timer);
  }, [chars, visible, reduce]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-base/80 shadow-lg backdrop-blur">
        <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-accent-500/70" />
          <span className="ml-3 text-xs text-slate-500">~/devconnect</span>
        </div>
        <div aria-hidden="true" className="min-h-[11rem] space-y-1 overflow-x-auto p-4 text-sm">
          <div className="text-slate-200">
            <span className="mr-2 text-accent-400">$</span>
            {CMD.slice(0, chars)}
            {chars < CMD.length && <span className="cursor" />}
          </div>
          {OUTPUT.slice(0, visible).map((line) => (
            <div key={line} className={line.startsWith("…") ? "text-slate-500" : "text-slate-200"}>
              {line}
            </div>
          ))}
          {visible === OUTPUT.length && (
            <div className="text-accent-400">
              $ <span className="cursor" />
            </div>
          )}
        </div>
      </div>

      {/* floating tech badges (desktop only) */}
      <span className="float absolute -right-3 -top-4 hidden rounded border border-accent-500/40 bg-base px-2 py-1 text-xs text-accent-400 md:block">
        {"{ react }"}
      </span>
      <span
        className="float absolute -bottom-4 -left-3 hidden rounded border border-accent-500/40 bg-base px-2 py-1 text-xs text-accent-400 md:block"
        style={{ animationDelay: "1.5s" }}
      >
        node
      </span>
      <span
        className="float absolute -bottom-3 right-8 hidden rounded border border-accent-500/40 bg-base px-2 py-1 text-xs text-accent-400 md:block"
        style={{ animationDelay: "3s" }}
      >
        git
      </span>
    </div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/feed" replace />;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-base text-slate-200">
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <span className="font-bold text-white">
          <span className="text-accent-400">$</span> <span className="cursor">devconnect</span>
        </span>
        <nav className="flex items-center gap-4 text-sm">
          <a href="#features" className="hidden text-slate-400 hover:text-white sm:inline">
            features
          </a>
          <a href="#how" className="hidden text-slate-400 hover:text-white sm:inline">
            how it works
          </a>
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

      <main className="relative z-10 mx-auto max-w-5xl px-4">
        {/* hero */}
        <section className="relative grid items-center gap-12 py-12 md:grid-cols-2 md:py-20">
          <div
            aria-hidden="true"
            className="grid-bg pointer-events-none absolute inset-x-[-100vw] top-[-5rem] -z-10 h-[34rem]"
          />
          <div
            aria-hidden="true"
            className="hero-glow pointer-events-none absolute inset-x-[-100vw] top-[-5rem] -z-10 h-[34rem]"
          />

          <div>
            <p className="text-sm text-accent-400">{"// developer community"}</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
              Connect with <span className="text-accent-400">developers</span> worldwide
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
              <a
                href="#features"
                className="rounded-lg border border-white/10 px-5 py-2 text-slate-200 hover:bg-white/5"
              >
                learn more
              </a>
            </div>
          </div>

          <TerminalCard />
        </section>

        {/* stack strip */}
        <section className="pb-12">
          <p className="mb-3 text-xs text-slate-500">{"// built with"}</p>
          <ul className="flex flex-wrap gap-2">
            {stack.map((s) => (
              <li
                key={s}
                className="rounded border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-slate-300"
              >
                {s}
              </li>
            ))}
          </ul>
        </section>

        {/* features */}
        <section id="features" className="scroll-mt-6 pb-16">
          <h2 className="mb-6 text-xl font-semibold text-white">
            <span className="text-accent-400">&gt;</span> features
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.cmd} className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm text-accent-400">$ {f.cmd}</p>
                <h3 className="mt-2 font-semibold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section id="how" className="scroll-mt-6 pb-16">
          <h2 className="mb-6 text-xl font-semibold text-white">
            <span className="text-accent-400">&gt;</span> how it works
          </h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="rounded-xl border border-white/10 p-5">
                <p className="text-2xl font-bold text-accent-400">{s.n}</p>
                <h3 className="mt-2 font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* closing call to action */}
        <section className="mb-16 rounded-xl border border-accent-500/40 bg-accent-500/5 p-6 text-center sm:p-10">
          <p className="text-sm text-accent-400">$ ready --join</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Join the community</h2>
          <p className="mt-2 text-slate-400">It takes a minute, and it's free.</p>
          <Link
            to="/register"
            className="mt-5 inline-block rounded-lg bg-accent-500 px-6 py-2 font-medium text-white hover:bg-accent-400"
          >
            create account
          </Link>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-6 text-center text-xs text-slate-500">
        built with React, Node.js, PostgreSQL and Prisma
      </footer>
    </div>
  );
}