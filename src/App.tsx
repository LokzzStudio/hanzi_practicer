import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTERS } from './utils/charactersData';
import { addExp, DEFAULT_STATS, loadStats, MAX_LEVEL, saveStats, type HeroStatsMap } from './utils/heroStats';
import SelectionPage from './pages/SelectionPage';
import PracticePage, { type WriteResult } from './pages/PracticePage';

export default function App() {
  const [heroStats, setHeroStats] = useState<HeroStatsMap>(loadStats);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Source of truth for synchronous reads inside writer callbacks.
  const statsRef = useRef(heroStats);

  useEffect(() => {
    saveStats(heroStats);
  }, [heroStats]);

  /** One correctly written character = +1 EXP, up to MAX_LEVEL. */
  const handleWrite = useCallback((charId: number): WriteResult => {
    const current = statsRef.current[charId] ?? DEFAULT_STATS;
    if (current.level >= MAX_LEVEL) return 'max';
    const { next, leveledUp } = addExp(current, 1);
    statsRef.current = { ...statsRef.current, [charId]: next };
    setHeroStats(statsRef.current);
    return leveledUp ? 'levelup' : 'exp';
  }, []);

  const closePractice = useCallback(() => setSelectedId(null), []);
  const selectedChar = selectedId !== null ? CHARACTERS.find(c => c.id === selectedId) : undefined;

  return (
    <>
      {/* Stays mounted under the practice page so its scroll position survives. */}
      <SelectionPage characters={CHARACTERS} heroStats={heroStats} onSelect={setSelectedId} />
      {selectedChar && (
        <PracticePage
          key={selectedChar.id}
          char={selectedChar}
          stats={heroStats[selectedChar.id] ?? DEFAULT_STATS}
          onWrite={handleWrite}
          onClose={closePractice}
        />
      )}
    </>
  );
}
