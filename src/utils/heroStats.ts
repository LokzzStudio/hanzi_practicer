import config from '../param/config.json';

export interface HeroStats {
  level: number;
  exp: number;
}

export type HeroStatsMap = Record<number, HeroStats>;

export const MAX_LEVEL = config.levelup.maxLevel;
export const DEFAULT_STATS: HeroStats = { level: 1, exp: 0 };

const STORAGE_KEY = 'hanzi-practicer:heroStats:v1';

/** EXP needed to go from `level` to `level + 1`. */
export function expRequired(level: number) {
  return level * config.levelup.levelUpExpBase;
}


/**
 * Adds EXP and rolls over level-ups. The only cap is MAX_LEVEL; at the cap
 * EXP is pinned to 0 and further gains are ignored.
 */
export function addExp(stats: HeroStats, amount: number): { next: HeroStats; leveledUp: boolean } {
  if (stats.level >= MAX_LEVEL) return { next: stats, leveledUp: false };

  let level = stats.level;
  let exp = stats.exp + amount;
  let leveledUp = false;
  while (level < MAX_LEVEL && exp >= expRequired(level)) {
    exp -= expRequired(level);
    level += 1;
    leveledUp = true;
  }
  if (level >= MAX_LEVEL) exp = 0;
  return { next: { level, exp }, leveledUp };
}

export function loadStats(): HeroStatsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStats(stats: HeroStatsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable (private mode etc.) — progress just won't persist.
  }
}
