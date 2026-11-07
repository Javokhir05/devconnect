import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, House, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = [
    { to: "/feed", label: "feed", icon: House },
    { to: "/explore", label: "explore", icon: Compass },
    { to: `/u/${user.username}`, label: "profile", icon: User },
  ];

  const sideLink = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      isActive ? "bg-accent-500/15 text-accent-400" : "text-slate-400 hover:text-white"
    }`;

  const tabLink = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
      isActive ? "text-accent-400" : "text-slate-500"
    }`;

  return (
    <div className="min-h-screen bg-base text-slate-200 md:flex">
      {/* desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/10 p-4 md:sticky md:top-0 md:flex md:h-screen">
        <h1 className="mb-6 text-lg font-bold text-white">
          <span className="text-accent-400">$</span> <span className="cursor">devconnect</span>
        </h1>
        <nav className="flex-1 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={sideLink}>
              <Icon size={16} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 pt-3 text-sm">
          <p className="truncate text-accent-400">@{user.username}</p>
          <ThemeToggle label className="-ml-1 block" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white"
          >
            <LogOut size={16} aria-hidden="true" />
            logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile top bar */}
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
          <h1 className="font-bold text-white">
            <span className="text-accent-400">$</span> <span className="cursor">devconnect</span>
          </h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="rounded p-1 text-slate-400 hover:text-white"
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 pb-24 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-white/10 bg-base pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={tabLink}>
            <Icon size={20} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}