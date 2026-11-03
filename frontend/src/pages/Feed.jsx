import { useAuth } from "../context/AuthContext";

export default function Feed() {
  const { user } = useAuth();
  return <h2 className="text-xl font-semibold text-white">Welcome, {user.username}</h2>;
}