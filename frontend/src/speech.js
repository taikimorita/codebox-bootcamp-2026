// Text-to-speech with the browser's built-in speechSynthesis. No server, no API key.
import { useEffect, useState } from "react";

const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

const normalize = (lang) => lang.replace("_", "-").toLowerCase();

// Best voice for a locale like "ja-JP": an exact match first, then any voice for the same language
function findVoice(voices, locale) {
  const want = normalize(locale);
  const language = want.split("-")[0];
  const exact = voices.find((v) => normalize(v.lang) === want);
  if (exact) return exact;
  return (
    voices.find((v) => {
      const lang = normalize(v.lang);
      // zh-HK voices speak Cantonese, which would be wrong for Mandarin cards
      if (language === "zh" && (lang === "zh-hk" || lang.startsWith("yue")))
        return false;
      return lang.split("-")[0] === language;
    }) ?? null
  );
}

// The language's tts_locale (from the languages table), or the plain code as a fallback
export function localeFor(languages, code) {
  return languages.find((l) => l.code === code)?.tts_locale ?? code;
}

/**
 * The voice for a locale, or null if the browser has none (or no speech support at all).
 * Some browsers load voices after the page, so this updates when they arrive.
 */
export function useVoice(locale) {
  const [voices, setVoices] = useState(() => synth?.getVoices() ?? []);

  useEffect(() => {
    if (!synth) return;
    const update = () => setVoices(synth.getVoices());
    synth.addEventListener("voiceschanged", update);
    return () => synth.removeEventListener("voiceschanged", update);
  }, []);

  return locale ? findVoice(voices, locale) : null;
}

export function speak(text, voice) {
  if (!synth || !voice) return;
  synth.cancel(); // stop anything still playing
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  synth.speak(utterance);
}
