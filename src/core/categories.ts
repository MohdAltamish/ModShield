import { BanCategory } from './types';

/** Keyword patterns used to infer ban categories from moderator notes */
const CATEGORY_KEYWORDS: Record<Exclude<BanCategory, 'spam'>, string[]> = {
  bot: ['bot', 'automated', 'script', 'auto-post', 'karma farm'],
  scam: ['scam', 'fraud', 'phish', 'fake', 'impersonat', 'crypto'],
  harassment: ['harass', 'threat', 'abuse', 'stalk', 'doxx', 'hate'],
};

/**
 * Infer ban category from the moderator's ban note/reason text.
 * Scans for keywords in priority order: bot → scam → harassment.
 * Falls back to 'spam' if no keywords match.
 */
export function inferCategory(modNote: string): BanCategory {
  const note = modNote.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => note.includes(kw))) {
      return category as BanCategory;
    }
  }

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
