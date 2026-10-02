import { FileUp } from "lucide-react";
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
      className={`flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition focus-within:border-accent ${dragging ? "border-accent bg-accent/10" : "border-line-strong hover:border-accent/60 hover:bg-accent/5"} ${disabled ? "pointer-events-none opacity-50" : ""}`}
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
      <span className="mb-3 grid size-11 place-items-center rounded-full bg-accent/10 text-accent-ink">
        <FileUp className="size-5" aria-hidden="true" />
      </span>
      <span className="block text-sm font-medium">{label}</span>
      {hint && <span className="mt-1 block text-xs text-subtle">{hint}</span>}
    </label>
  );
}
