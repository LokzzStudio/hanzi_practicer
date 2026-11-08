import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { ArrowLeft, PenLine, Play, Square, Volume2 } from 'lucide-react';
import config from '../param/config.json';
import type { CharacterData } from '../utils/charactersData';
import { expRequired, MAX_LEVEL, type HeroStats } from '../utils/heroStats';
import { getCharacterImageUrl } from '../utils/resourceUtils';
import { pronounce, stopSpeech } from '../utils/speech';

export type WriteResult = 'exp' | 'levelup' | 'max';

interface PracticePageProps {
  char: CharacterData;
  stats: HeroStats;
  /** Called once per correctly written character; returns what it earned. */
  onWrite: (charId: number) => WriteResult;
  onClose: () => void;
}

const IDLE = 'Tap the box to watch the strokes';
const WATCHING = 'Watching stroke order…';

const GAIN_LABEL: Record<WriteResult, string> = {
  exp: '+1 EXP',
  levelup: 'Level up!',
  max: 'Max level',
};

export default function PracticePage({ char, stats, onWrite, onClose }: PracticePageProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const writerRef = useRef<HanziWriter | null>(null);
  const practicingRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const onWriteRef = useRef(onWrite);
  onWriteRef.current = onWrite;

  // Box size is fixed at mount: fits a phone with a 24px gutter, caps at 300.
  const [size] = useState(() => Math.min(300, window.innerWidth - 48));
  const [status, setStatus] = useState(WATCHING);
  const [isPracticing, setIsPracticing] = useState(false);
  const [gain, setGain] = useState<{ key: number; result: WriteResult } | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const heroImage = getCharacterImageUrl(char.char);

  const isMax = stats.level >= MAX_LEVEL;
  const needed = expRequired(stats.level);
  const pct = isMax ? 100 : Math.min(100, (stats.exp / needed) * 100);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const watch = () => {
    const writer = writerRef.current;
    if (!writer || practicingRef.current) return;
    setStatus(WATCHING);
    writer.animateCharacter({ onComplete: () => setStatus(s => (s === WATCHING ? IDLE : s)) });
  };

  // Build the writer once per character.
  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    el.innerHTML = '';

    const writer = HanziWriter.create(el, char.char, {
      width: size,
      height: size,
      padding: 16,
      showOutline: true,
      strokeAnimationSpeed: 1.5,
      delayBetweenStrokes: 100,
      strokeColor: '#1c1917',
      radicalColor: '#1c1917',
      outlineColor: '#e7e5e4',
      drawingColor: '#1c1917',
      highlightColor: '#f59e7b',
      drawingWidth: Math.round(size / 20),
      leniency: config.writing.leniency,
    });
    writerRef.current = writer;

    setStatus(WATCHING);
    writer.animateCharacter({ onComplete: () => setStatus(s => (s === WATCHING ? IDLE : s)) });
    pronounce(char.char);

    return () => {
      practicingRef.current = false;
      clearTimers();
      try {
        writer.cancelQuiz();
      } catch {
        /* writer may not have loaded yet */
      }
      writerRef.current = null;
      el.innerHTML = '';
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char.id]);

  const startQuiz = () => {
    const writer = writerRef.current;
    if (!writer) return;
    setStatus('Write the character');
    writer.quiz({
      onMistake: () => setStatus('Not quite — try that stroke again'),
      onCorrectStroke: (d: { strokesRemaining: number }) =>
        setStatus(d.strokesRemaining > 0 ? `${d.strokesRemaining} stroke${d.strokesRemaining === 1 ? '' : 's'} left` : 'Nice'),
      onComplete: () => {
        setStatus('Well done');
        pronounce(char.char);
        const result = onWriteRef.current(char.id);
        setGain({ key: Date.now(), result });
        later(() => {
          if (practicingRef.current) startQuiz();
        }, result === 'levelup' ? 1600 : 900);
      },
    });
  };

  const togglePractice = () => {
    const writer = writerRef.current;
    if (!writer) return;
    clearTimers();
    if (practicingRef.current) {
      practicingRef.current = false;
      setIsPracticing(false);
      writer.cancelQuiz();
      writer.showCharacter();
      setStatus(IDLE);
    } else {
      practicingRef.current = true;
      setIsPracticing(true);
      startQuiz();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="animate-fade-in fixed inset-0 z-10 overflow-y-auto overscroll-contain bg-paper">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-6">
        <header className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="-ml-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-line/50 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" /> All characters
          </button>
          <span className="text-sm tabular-nums text-muted">
            #{char.id}
            {char.strokes ? ` · ${char.strokes} strokes` : ''}
          </span>
        </header>

        <main className="flex flex-1 flex-col items-center justify-center gap-6 py-8 md:flex-row md:gap-12">
          {/* Hero portrait */}
          {!imageFailed && (
            <img
              src={heroImage}
              alt=""
              onError={() => setImageFailed(true)}
              className="h-40 w-40 shrink-0 object-contain md:h-72 md:w-72"
            />
          )}

          <div className="flex w-full flex-col items-center gap-6 md:w-auto">
          {/* Writing box with a 米字格 guide */}
          <div
            onClick={!isPracticing ? watch : undefined}
            className={`relative rounded-2xl border border-line bg-card shadow-sm ${!isPracticing ? 'cursor-pointer' : ''}`}
            style={{ width: size, height: size }}
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <g stroke="var(--color-grid)" strokeWidth="0.4" strokeDasharray="1.5 1.5" vectorEffect="non-scaling-stroke">
                <line x1="50" y1="0" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
                <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>
            <div ref={targetRef} className="relative" style={{ width: size, height: size }} />
          </div>

          <p className="h-5 text-sm text-muted" aria-live="polite">{status}</p>

          {/* Level & EXP */}
          <div className="w-full" style={{ maxWidth: size }}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm tabular-nums">
              <span>
                <span className="font-semibold">Lv {stats.level}</span>
                <span className="text-muted"> / {MAX_LEVEL}</span>
              </span>
              <span className="relative text-muted">
                {gain && (
                  <span key={gain.key} className="animate-rise absolute right-full mr-2 whitespace-nowrap font-medium text-accent">
                    {GAIN_LABEL[gain.result]}
                  </span>
                )}
                {isMax ? 'Max level' : `${stats.exp} / ${needed} EXP`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex w-full items-center gap-2" style={{ maxWidth: size }}>
            <button
              onClick={() => pronounce(char.char)}
              aria-label="Pronounce"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink hover:bg-line/40"
            >
              <Volume2 className="h-5 w-5" />
            </button>
            <button
              onClick={watch}
              disabled={isPracticing}
              aria-label="Watch stroke order"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-card text-ink hover:bg-line/40 disabled:opacity-40"
            >
              <Play className="h-5 w-5" />
            </button>
            <button
              onClick={togglePractice}
              className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition ${
                isPracticing ? 'border border-line bg-card text-ink hover:bg-line/40' : 'bg-accent text-white hover:brightness-110'
              }`}
            >
              {isPracticing ? <Square className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
              {isPracticing ? 'Stop' : 'Practice'}
            </button>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
