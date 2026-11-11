import { Link, Outlet } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const points = [
  "share projects and posts",
  "follow developers, find people by skill",
  "one profile for your stack and links",
];

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-base text-slate-200 md:grid md:grid-cols-2">
      {/* brand panel: desktop only */}
      <aside className="relative hidden overflow-hidden border-r border-white/10 p-10 md:flex md:flex-col md:justify-between">
        <div aria-hidden="true" className="grid-bg pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />

        <Link to="/" className="relative text-lg font-bold text-white">
          <span className="text-accent-400">$</span> <span className="cursor">DevConnect</span>
        </Link>

        <div className="relative">
          <p className="text-sm text-accent-400">{"// developer community"}</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-white">
            Where developers share what they build
          </h2>
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-base/80 backdrop-blur">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-500/70" />
            </div>
            <ul className="space-y-1 p-4 text-sm">
              {points.map((p) => (
                <li key={p} className="text-slate-300">
                  <span className="mr-2 text-accent-400">✔</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* <p className="relative text-xs text-slate-500">
          built with React, Node.js, PostgreSQL and Prisma
        </p> */}
      </aside>

      {/* form side */}
      <main className="flex min-h-screen flex-col px-4 py-4 sm:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sm text-slate-400 hover:text-white">
            ← home
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm">
            <Link
              to="/"
              className="mb-6 block text-center text-2xl font-bold text-white md:hidden"
            >
              <span className="text-accent-400">$</span> <span className="cursor">DevConnect</span>
            </Link>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}