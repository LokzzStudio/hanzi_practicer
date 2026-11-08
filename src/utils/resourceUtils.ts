import config from '../param/config.json';
import resourcesText from '../param/resources.txt?raw';

// resources.txt: Category,Item,Folder,Name — the "Soldiers" row holds the hero image pattern.
const heroRule = resourcesText
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map(line => line.split(',').map(s => s.trim()))
  .find(([, item]) => item === 'Soldiers');

export function getCharacterImageUrl(char: string) {
  if (!heroRule) return '';
  const [, , folder, name] = heroRule;
  const path = `${encodeURIComponent(folder)}%2F${encodeURIComponent(name.replace('{characters}', char))}`;
  return `${config.path.baseUrl}${path}?alt=media&token=${config.path.token}`;
}
