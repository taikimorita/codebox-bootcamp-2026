import SpeakButton from "./SpeakButton.jsx";

const faceClass =
  "col-start-1 row-start-1 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-line bg-surface p-8 text-center shadow-sm backface-hidden";

/**
 * A card that flips over to show the answer. Both faces sit in the same grid cell,
 * so the card is as tall as the bigger one. The face you can't see is `inert`:
 * screen readers skip it and it can't be clicked.
 * Render with key={card.id} so a new card starts face-up without animating.
 */
export default function Flashcard({ card, revealed, voice, onReveal }) {
  return (
    <div className="perspective-[1400px]">
      <div
        className={`grid transition-transform duration-500 ease-out transform-3d ${revealed ? "rotate-y-180" : ""}`}
      >
        {/* Front */}
        <div
          inert={revealed}
          onClick={onReveal}
          className={`${faceClass} cursor-pointer`}
        >
          <p className="mb-6 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
            {card.deck_name}
          </p>
          <p
            lang={card.language_code}
            className="text-4xl font-medium break-words whitespace-pre-wrap sm:text-5xl"
          >
            {card.front}
          </p>
          <SpeakButton text={card.front} voice={voice} className="mt-4" />
          <p className="mt-6 text-xs text-subtle">Tap or press Space to flip</p>
        </div>

        {/* Back */}
        <div inert={!revealed} className={`${faceClass} rotate-y-180`}>
          <div className="flex items-center gap-1">
            <p
              lang={card.language_code}
              className="text-2xl font-medium whitespace-pre-wrap text-muted"
            >
              {card.front}
            </p>
            <SpeakButton text={card.front} voice={voice} size="sm" />
          </div>
          {card.reading && (
            <p
              lang={card.language_code}
              className="mt-1 text-lg whitespace-pre-wrap text-accent-ink"
            >
              {card.reading}
            </p>
          )}
          <div className="my-5 h-px w-16 bg-line" />
          <p className="text-2xl font-semibold whitespace-pre-wrap sm:text-3xl">
            {card.back}
          </p>
          {card.notes && (
            <p className="mt-4 max-w-sm text-sm whitespace-pre-wrap text-subtle">
              {card.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
