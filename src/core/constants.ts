/**
 * ModShield - Core Constants
 *
 * Centralized configuration constants used across the application.
 * Change these values to adjust default behavior without modifying business logic.
 */

/** Maximum number of alerts stored in the activity log per subreddit */
export const MAX_ALERT_LOG_SIZE = 50;

/** Redis key prefixes */
export const REDIS_KEYS = {
  /** Key pattern for flagged user records: `flagged:{username}` */
  FLAGGED_USER: 'flagged:',
  /** Key for subreddit configuration */
  CONFIG: 'config:modshield',
  /** Key pattern for alert logs: `log:alerts:{subredditName}` */
  ALERT_LOG: 'log:alerts:',
} as const;

/** Trust score multiplier for trusted subreddit reports */
export const TRUSTED_MULTIPLIER = 2;

/** App version string for modmail footer */
export const APP_VERSION = '0.0.9';

/** Default auto-ban thresholds per category */
export const DEFAULT_THRESHOLDS = {
  spam: 3,
  bot: 1,
  scam: 2,
  harassment: 3,
} as const;
