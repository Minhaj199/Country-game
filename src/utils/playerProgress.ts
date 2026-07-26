import { XP_PER_LEVEL } from '@/constants/player';

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLevelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getXpIntoCurrentLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}
