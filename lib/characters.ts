import fs from 'fs';
import path from 'path';

const logsDir = path.join(__dirname, '../logs');

export async function getCharacters(bookTitle: string): Promise<any[]> {
  const bookDir = path.join(logsDir, bookTitle);
  const charactersFile = path.join(bookDir, 'characters.json');

  if (!fs.existsSync(charactersFile)) {
    return [];
  }

  const data = await fs.promises.readFile(charactersFile, 'utf-8');
  return JSON.parse(data);
}

export async function updateCharacters(bookTitle: string, updatedCharacters: any[]): Promise<void> {
  const bookDir = path.join(logsDir, bookTitle);

  if (!fs.existsSync(bookDir)) {
    await fs.promises.mkdir(bookDir, { recursive: true });
  }

  const charactersFile = path.join(bookDir, 'characters.json');
  const data = JSON.stringify(updatedCharacters, null, 2);
  await fs.promises.writeFile(charactersFile, data, 'utf-8');
}
