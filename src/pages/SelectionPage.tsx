import { memo } from 'react';
import type { CharacterData } from '../utils/charactersData';
import { DEFAULT_STATS, expRequired, MAX_LEVEL, type HeroStatsMap } from '../utils/heroStats';

interface SelectionPageProps {
  characters: CharacterData[];
  heroStats: HeroStatsMap;
  onSelect: (id: number) => void;
}

const SelectionPage = memo(function SelectionPage({ characters, heroStats, onSelect }: SelectionPageProps) {
  const maxedCount = characters.filter(c => (heroStats[c.id]?.level ?? 1) >= MAX_LEVEL).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Hanzi Practicer</h1>
          <p className="mt-1 text-sm text-muted">Pick a character and write it to level up.</p>
        </div>
        <p className="text-sm text-muted tabular-nums">
          <span className="font-medium text-ink">{maxedCount}</span> / {characters.length} at Lv {MAX_LEVEL}
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(68px,1fr))] gap-2">
        {characters.map(c => {
          const stats = heroStats[c.id] ?? DEFAULT_STATS;
          const isMax = stats.level >= MAX_LEVEL;
          const started = stats.level > 1 || stats.exp > 0;
          const pct = isMax ? 100 : (stats.exp / expRequired(stats.level)) * 100;

          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              aria-label={`${c.char}, level ${stats.level}`}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-accent ${
                isMax ? 'border-accent' : 'border-line'
              }`}
            >
              <span className="font-hanzi text-3xl leading-none">{c.char}</span>
              <span className={`mt-1.5 text-[11px] tabular-nums ${isMax ? 'font-medium text-accent' : started ? 'text-ink' : 'text-muted'}`}>
                {isMax ? 'MAX' : `Lv ${stats.level}`}
              </span>
              {started && !isMax && (
                <span className="absolute inset-x-2 bottom-1.5 h-0.5 overflow-hidden rounded-full bg-line">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default SelectionPage;
