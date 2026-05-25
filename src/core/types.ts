/** Supported ban categories for the ModShield network */
export type BanCategory = 'spam' | 'bot' | 'scam' | 'harassment';

/** A record of a flagged user in the ModShield network database */
export type BanRecord = {
  /** Reddit username (stored lowercase) */
  username: string;
  /** Why they were banned (inferred from ban note) */
  category: BanCategory;
  /** Which subreddit first flagged this user */
  sourceSub: string;
  /** Moderator username who issued the original ban */
  bannedBy: string;
  /** Unix timestamp (ms) when ban was first recorded */
  timestamp: number;
  /** Total number of subreddits that have flagged this user */
  reportCount: number;
  /** Number of flags from subreddits marked as trusted */
  trustedReportCount: number;
  /** List of all subreddit names that have flagged this user */
  subreddits: string[];
};

/** Per-subreddit configuration for ModShield */
export type SubConfig = {
  /** Whether this subreddit is participating in the network */
  enabled: boolean;
  /** When true, only sends alerts without auto-banning */
  alertOnly: boolean;
  /** Per-category thresholds for triggering auto-bans */
  thresholds: Record<BanCategory, number>;
  /** List of trusted subreddit names (flags count double) */
  trustedSubs: string[];
  /** Whether to alert moderators on the very first network flag */
  notifyOnFirstFlag: boolean;
};

/** A log entry for an alert sent to a subreddit */
export type AlertRecord = {
  /** The flagged username */
  username: string;
  /** Ban category of the flagged user */
  category: BanCategory;
  /** Original subreddit that first flagged the user */
  sourceSub: string;
  /** When this alert was generated */
  timestamp: number;
  /** Link to the post or comment that triggered the alert */
  postOrCommentUrl: string;
  /** What action was taken in response to the alert */
  actionTaken: 'alerted' | 'auto-banned';
};

