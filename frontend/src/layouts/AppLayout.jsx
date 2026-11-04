import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }) =>
  `block rounded-lg px-3 py-2 text-sm ${
    isActive ? "bg-indigo-500/20 text-white" : "text-slate-400 hover:text-white"
  }`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#0B0B1E] text-slate-200">
      <aside className="flex w-56 flex-col border-r border-white/10 p-4">
        <h1 className="mb-6 text-lg font-bold text-white">{"</>"} DevConnect</h1>
        <nav className="flex-1 space-y-1">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/explore" className={linkClass}>Explore</NavLink>
          <NavLink to={`/u/${user.username}`} className={linkClass}>Profile</NavLink>
        </nav>
        <div className="border-t border-white/10 pt-3 text-sm">
          <p className="text-white">@{user.username}</p>
          <button onClick={handleLogout} className="mt-1 text-slate-400 hover:text-white">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}