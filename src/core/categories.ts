import { BanCategory } from './types';

/**
 * Infer ban category from the moderator's ban note/reason text.
 * Scans for keywords. Falls back to 'spam'.
 */
export function inferCategory(modNote: string): BanCategory {
  const note = modNote.toLowerCase();
  if (note.includes('bot') || note.includes('automated')) return 'bot';
  if (note.includes('scam') || note.includes('fraud') || note.includes('phish')) return 'scam';
  if (note.includes('harass') || note.includes('threat') || note.includes('abuse')) return 'harassment';
  return 'spam';
}

export const CATEGORY_LABELS: Record<BanCategory, string> = {
  spam: '🗑️ Spam',
  bot: '🤖 Bot',
  scam: '💸 Scam',
  harassment: '🚨 Harassment',
};

export const CATEGORY_EMOJI: Record<BanCategory, string> = {
  spam: '🗑️',
  bot: '🤖',
  scam: '💸',
  harassment: '🚨',
};
