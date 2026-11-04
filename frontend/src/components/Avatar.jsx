const sizes = {
  sm: "h-8 w-8 text-sm",
  md: "h-14 w-14 text-xl",
  lg: "h-20 w-20 text-3xl",
};

export default function Avatar({ user, size = "md" }) {
  const base = `${sizes[size]} shrink-0 rounded-full border border-accent-500/60`;

  // photo avatars come later (image uploads); the fallback is the user's initial
  if (user.avatar) {
    return <img src={user.avatar} alt="" className={`${base} object-cover`} />;
  }

  return (
    <div
      aria-hidden="true"
      className={`${base} flex items-center justify-center bg-accent-500/15 font-bold uppercase text-accent-400`}
    >
      {user.username[0]}
    </div>
  );
}