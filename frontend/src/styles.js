// Class strings shared across components, so inputs, cards and menus look the same everywhere

// No size or colours: combine with your own (Tailwind can't tell which of two clashing classes wins)
export const fieldBase =
  "rounded-lg border text-fg placeholder:text-subtle transition focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none";

export const inputClass = `${fieldBase} w-full border-line bg-surface px-3 py-2 text-sm`;

export const cardClass = "rounded-2xl border border-line bg-surface";

export const menuItemClass =
  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-fg transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none";

export const textLinkClass =
  "font-medium text-accent-ink underline-offset-4 hover:underline";
