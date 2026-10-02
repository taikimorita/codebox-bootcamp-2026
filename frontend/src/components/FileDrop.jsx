import { useState } from "react";

// A drop zone that is also a normal file picker (click or keyboard)
export default function FileDrop({ accept, label, hint, disabled, onFile }) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && !disabled) onFile(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`block cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition focus-within:border-emerald-500 ${dragging ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 hover:border-zinc-500"} ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files[0];
          e.target.value = ""; // so picking the same file again still fires
          if (file) onFile(file);
        }}
        className="sr-only"
      />
      <span className="block text-sm">{label}</span>
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}
