export default function SkillTags({ skills = [], className = "" }) {
  if (!skills.length) return null;
  return (
    <ul className={`mt-2 flex flex-wrap gap-1.5 ${className}`}>
      {skills.map((s) => (
        <li
          key={s}
          className="rounded border border-accent-500/40 bg-accent-500/10 px-2 py-0.5 text-xs text-accent-400"
        >
          #{s}
        </li>
      ))}
    </ul>
  );
}