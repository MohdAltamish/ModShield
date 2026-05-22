import { SubConfig } from './types';

/**
 * Check if a subreddit is in this installation's trusted list.
 */
export function isTrusted(config: SubConfig, subredditName: string): boolean {
  return config.trustedSubs
    .map((s) => s.toLowerCase())
    .includes(subredditName.toLowerCase());
}

/**
 * Compute effective report count for auto-ban decisions.
 * Trusted reports count double.
 * Example: 1 trusted + 2 regular = effective score of 4
 */
export function effectiveScore(record: {
  reportCount: number;
  trustedReportCount: number;
}): number {
  const regularReports = record.reportCount - record.trustedReportCount;
  return regularReports + (record.trustedReportCount * 2);
}

/**
 * Given a config and a ban record, decide if auto-ban should trigger.
 */
export function shouldAutoBan(
  config: SubConfig,
  record: { reportCount: number; trustedReportCount: number },
  category: keyof SubConfig['thresholds']
): boolean {
  if (config.alertOnly) return false;
  const threshold = config.thresholds[category] ?? 3;
  return effectiveScore(record) >= threshold;
}
