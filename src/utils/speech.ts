const hasSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Prefer a Mandarin voice: mainland, then Taiwan, then any non-Cantonese zh voice. */
function pickMandarinVoice() {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => /^zh[-_]CN/i.test(v.lang)) ||
    voices.find(v => /^zh[-_]TW/i.test(v.lang)) ||
    voices.find(v => /^(zh|cmn)/i.test(v.lang) && !/HK|yue/i.test(v.lang)) ||
    null
  );
}

export function stopSpeech() {
  if (hasSpeech()) window.speechSynthesis.cancel();
}

/** Speaks a word in Mandarin, cancelling anything already playing. */
export function pronounce(text: string) {
  if (!hasSpeech()) return;
  window.speechSynthesis.cancel();

  const run = () => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    u.rate = 0.8;
    const voice = pickMandarinVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    }
    window.speechSynthesis.speak(u);
  };

  // Some browsers populate the voice list asynchronously.
  if (window.speechSynthesis.getVoices().length === 0) {
    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.onvoiceschanged = null;
      run();
    };
    window.speechSynthesis.onvoiceschanged = once;
    setTimeout(once, 150);
  } else {
    run();
  }
}
