# Hanzi Practicer

A clean, minimal practice tool derived from `hanzi_heroes`: a character grid and a writing page.

- Pick any of the 300 characters from the grid. The word is pronounced in Mandarin (browser speech; uses a zh-CN voice, falling back to zh-TW).
- Press **PRACTICE** and write the character. Each correct write gives +1 EXP.
- EXP to the next level = `level × 5`. Heroes level up to **Lv.10** with no other limit (no practice cap, no acquisition or memory gating).
- Progress is saved in the browser's `localStorage`.

Tuning lives in `src/param/config.json` (`levelup.levelUpExpBase`, `levelup.maxLevel`, `writing.leniency`). Character data is `src/param/characters.txt`, copied from `hanzi_heroes`.

## Run

```
npm install
npm run dev
```

`npm run build` outputs a static site to `dist/`.
