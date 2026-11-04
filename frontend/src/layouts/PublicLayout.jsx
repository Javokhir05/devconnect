import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
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