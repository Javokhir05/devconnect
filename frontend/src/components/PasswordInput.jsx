import { useState } from "react";
import { field } from "../utils/ui";

export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, minLength }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={minLength}
        required
        className={`${field} pr-16`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-3 text-xs text-slate-400 hover:text-white"
      >
        {show ? "hide" : "show"}
      </button>
    </div>
  );
}