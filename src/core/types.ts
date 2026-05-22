export type BanCategory = 'spam' | 'bot' | 'scam' | 'harassment';

export type BanRecord = {
  username: string;           // Reddit username (lowercase)
  category: BanCategory;      // Why they were banned
  sourceSub: string;          // Which subreddit banned them first
  bannedBy: string;           // Moderator username who banned them
  timestamp: number;          // Unix ms when ban was recorded
  reportCount: number;        // How many subreddits have flagged this user
  trustedReportCount: number; // Reports from trusted subreddits only
  subreddits: string[];       // List of all subs that flagged this user
};

export type SubConfig = {
  enabled: boolean;                        // Is this sub participating?
  alertOnly: boolean;                      // Alert-only (no auto-ban)?
  thresholds: Record<BanCategory, number>; // Per-category auto-ban threshold
  trustedSubs: string[];                   // Subreddits this mod team trusts
  notifyOnFirstFlag: boolean;              // Alert even on first-ever flag?
};

export type AlertRecord = {
  username: string;
  category: BanCategory;
  sourceSub: string;
  timestamp: number;
  postOrCommentUrl: string;
  actionTaken: 'alerted' | 'auto-banned';
};
