import { useEffect, useRef, useState } from "react";

// A button that opens a small menu. Closes on outside click, Escape, or picking an item.
export default function Dropdown({ label, button, buttonClassName = "", children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent ${buttonClassName}`}
      >
        {button}
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute right-0 top-full z-40 mt-2 min-w-52 animate-fade-in rounded-xl border border-line bg-surface p-1 shadow-xl shadow-black/10"
        >
          {children}
        </div>
      )}
    </div>
  );
}
