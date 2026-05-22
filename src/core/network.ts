import { redis as defaultRedis } from '@devvit/redis';
import { BanRecord, BanCategory, SubConfig, AlertRecord } from './types';

const DEFAULT_CONFIG: SubConfig = {
  enabled: true,
  alertOnly: true,
  thresholds: { spam: 3, bot: 1, scam: 2, harassment: 3 },
  trustedSubs: [],
  notifyOnFirstFlag: true,
};

// ─── BAN RECORD OPERATIONS ─────────────────────────────────────────────────

/**
 * Record a new ban from this subreddit.
 * If the user is already flagged, increment counts.
 * If the banning sub is trusted by others, trustedReportCount increases.
 */
export async function recordBan(
  input: {
    username: string;
    category: BanCategory;
    sourceSub: string;
    bannedBy: string;
    isTrustedSource: boolean;
  },
  redis = defaultRedis
): Promise<BanRecord> {
  const key = `flagged:${input.username.toLowerCase()}`;
  const existing = await redis.get(key);

  let record: BanRecord;

  if (existing) {
    record = JSON.parse(existing) as BanRecord;
    if (!record.subreddits.includes(input.sourceSub)) {
      record.reportCount += 1;
      record.subreddits.push(input.sourceSub);
      if (input.isTrustedSource) {
        record.trustedReportCount += 1;
      }
    }
  } else {
    record = {
      username: input.username.toLowerCase(),
      category: input.category,
      sourceSub: input.sourceSub,
      bannedBy: input.bannedBy,
      timestamp: Date.now(),
      reportCount: 1,
      trustedReportCount: input.isTrustedSource ? 1 : 0,
      subreddits: [input.sourceSub],
    };
  }

  await redis.set(key, JSON.stringify(record));
  return record;
}

/**
 * Look up a user in the network.
 * Returns null if user has never been flagged.
 */
export async function checkUser(
  username: string,
  redis = defaultRedis
): Promise<BanRecord | null> {
  const key = `flagged:${username.toLowerCase()}`;
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as BanRecord;
}

// ─── CONFIG OPERATIONS ─────────────────────────────────────────────────────

export async function getConfig(
  redis = defaultRedis
): Promise<SubConfig> {
  const raw = await redis.get('config:modshield');
  if (!raw) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
}

export async function saveConfig(
  config: SubConfig,
  redis = defaultRedis
): Promise<void> {
  await redis.set('config:modshield', JSON.stringify(config));
}

// ─── ACTIVITY LOG OPERATIONS ───────────────────────────────────────────────

/**
 * Append an alert to this subreddit's activity log.
 * Keeps only the most recent 50 entries (trim on write).
 */
export async function appendAlert(
  subredditName: string,
  alert: AlertRecord,
  redis = defaultRedis
): Promise<void> {
  const key = `log:alerts:${subredditName}`;
  const raw = await redis.get(key);
  const existing: AlertRecord[] = raw ? JSON.parse(raw) : [];
  const updated = [alert, ...existing].slice(0, 50);
  await redis.set(key, JSON.stringify(updated));
}

/**
 * Fetch the activity log for a subreddit (most recent first).
 */
export async function getAlerts(
  subredditName: string,
  redis = defaultRedis
): Promise<AlertRecord[]> {
  const key = `log:alerts:${subredditName}`;
  const raw = await redis.get(key);
  if (!raw) return [];
  return JSON.parse(raw) as AlertRecord[];
}
