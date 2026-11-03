import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B1E] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          {"</>"} DevConnect
        </h1>
        <Outlet />
      </div>
    </div>
  );
}