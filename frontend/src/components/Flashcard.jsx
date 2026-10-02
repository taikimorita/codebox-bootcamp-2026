import SpeakButton from "./SpeakButton.jsx";

export default function Flashcard({ card, revealed, voice }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center">
      <p className="mb-4 text-xs text-zinc-500">{card.deck_name}</p>
      <div className="flex items-start justify-center gap-2">
        <p
          lang={card.language_code}
          className="text-4xl font-medium whitespace-pre-wrap"
        >
          {card.front}
        </p>
        <SpeakButton text={card.front} voice={voice} className="mt-1 text-lg" />
      </div>

      {revealed && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          {card.reading && (
            <p
              lang={card.language_code}
              className="mb-2 text-lg text-zinc-400 whitespace-pre-wrap"
            >
              {card.reading}
            </p>
          )}
          <p className="text-xl whitespace-pre-wrap">{card.back}</p>
          {card.notes && (
            <p className="mt-4 text-sm text-zinc-500 whitespace-pre-wrap">
              {card.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
