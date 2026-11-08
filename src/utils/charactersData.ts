import charactersText from '../param/characters.txt?raw';

export interface CharacterData {
  id: number;
  char: string;
  strokes?: number;
}

// characters.txt is TSV with a header row; column 0 = character, column 2 = stroke count.
export const CHARACTERS: CharacterData[] = charactersText
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line, i) => {
    const parts = line.split('\t');
    const strokes = parseInt(parts[2]?.trim() ?? '', 10);
    return {
      id: i + 1,
      char: parts[0].trim(),
      strokes: Number.isNaN(strokes) ? undefined : strokes,
    };
  });
