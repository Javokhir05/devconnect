// Renders post text. Text between ``` fences becomes a code block.
// React escapes everything, so post content can never run as HTML.
export default function PostContent({ text, className = "text-slate-200"}) {
  const parts = text.split("```");
  // an unclosed fence leaves an even number of parts: show it as plain text
  const closed = parts.length % 2 === 1;

  return (
    <div className={`space-y-2 ${className}`}>
      {parts.map((part, i) => {
        const isCode = i % 2 === 1 && (closed || i < parts.length - 1);
        if (isCode) {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-accent-400"
            >
              <code>{part.replace(/^\n/, "").replace(/\n$/, "")}</code>
            </pre>
          );
        }
        const plain = (i % 2 === 1 ? "```" : "") + part;
        return plain.trim() ? (
          <p key={i} className="whitespace-pre-wrap break-words">
            {plain.trim()}
          </p>
        ) : null;
      })}
    </div>
  );
}