export default function SkillTags({ skills = [], className = "", onSelect, active = "" }) {
  if (!skills.length) return null;

  return (
    <ul className={`mt-2 flex flex-wrap gap-1.5 ${className}`}>
      {skills.map((s) => {
        const isActive = active && active.toLowerCase() === s.toLowerCase();
        const cls = `rounded border px-2 py-0.5 text-xs text-accent-400 ${
          isActive ? "border-accent-500 bg-accent-500/25" : "border-accent-500/40 bg-accent-500/10"
        }`;
        return (
          <li key={s}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(s)}
                aria-pressed={Boolean(isActive)}
                className={`${cls} hover:bg-accent-500/20`}
              >
                #{s}
              </button>
            ) : (
              <span className={cls}>#{s}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}