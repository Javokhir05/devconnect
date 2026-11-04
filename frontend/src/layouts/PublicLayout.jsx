import { Outlet } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

export default function PublicLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-base px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          <span className="text-accent-400">$</span>{" "}
          <span className="cursor">devconnect</span>
        </h1>
        <Outlet />
      </div>
    </div>
  );
}