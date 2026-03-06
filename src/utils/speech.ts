let koreanVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;
let pendingText: string | null = null;
let speakTimeout: ReturnType<typeof setTimeout> | null = null;

function loadVoices(): void {
  const voices = speechSynthesis.getVoices();
  koreanVoice = voices.find(v => v.lang.includes('ko')) || null;
  voicesLoaded = voices.length > 0;
}

// Load voices immediately and on change
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

function doSpeak(text: string): void {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = 0.85;

  if (koreanVoice) {
    u.voice = koreanVoice;
  }

  u.onstart = () => console.log('[Speech] Started:', text);
  u.onend = () => console.log('[Speech] Ended:', text);
  u.onerror = (e) => console.log('[Speech] Error:', e.error);

  console.log('[Speech] Speaking:', text);

  speechSynthesis.cancel();
  speechSynthesis.speak(u);

  // Chrome bug workaround: pause/resume to kick it
  setTimeout(() => {
    speechSynthesis.pause();
    speechSynthesis.resume();
  }, 50);
}

export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return;

  if (!voicesLoaded) {
    loadVoices();
  }

  // Debounce: wait 100ms for rapid calls to settle
  pendingText = text;

  if (speakTimeout) {
    clearTimeout(speakTimeout);
  }

  speakTimeout = setTimeout(() => {
    if (pendingText) {
      doSpeak(pendingText);
      pendingText = null;
    }
  }, 100);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
  }
}

export function unlockAudio(): void {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance('.');
    u.lang = 'ko-KR';
    u.volume = 0.01;
    speechSynthesis.speak(u);
  }
}
