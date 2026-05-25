import { reddit, context } from '@devvit/web/server';
import { BanRecord, AlertRecord } from './types';
import { CATEGORY_LABELS, CATEGORY_EMOJI } from './categories';
import { effectiveScore } from './trust';

export async function sendModmailAlert(
  username: string,
  record: BanRecord,
  postOrCommentUrl: string,
  actionTaken: AlertRecord['actionTaken']
): Promise<void> {
  const subredditName = context.subredditName ?? 'your subreddit';
  const daysAgo = Math.floor(
    (Date.now() - record.timestamp) / (1000 * 60 * 60 * 24)
  );

  const categoryLabel = CATEGORY_LABELS[record.category];
  const emoji = CATEGORY_EMOJI[record.category];
  const score = effectiveScore(record);
  const autoAction =
    actionTaken === 'auto-banned'
      ? '\n\n**⚡ Auto-ban was applied automatically.**'
      : '';

  const subject = `${emoji} ModShield: u/${username} flagged (${categoryLabel})`;

  const body = [
    `## ModShield Network Alert`,
    ``,
    `**u/${username}** has been flagged by the ModShield network.`,
    ``,
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Category** | ${categoryLabel} |`,
    `| **First flagged by** | r/${record.sourceSub} |`,
    `| **Time since first flag** | ${daysAgo} day(s) ago |`,
    `| **Subreddits flagged in** | ${record.reportCount} |`,
    `| **Trusted subreddit flags** | ${record.trustedReportCount} |`,
    `| **Network score** | ${score} |`,
    ``,
    `**Activity that triggered this alert:**`,
    postOrCommentUrl,
    ``,
    `**All flagging subreddits:** ${record.subreddits.map((s) => `r/${s}`).join(', ')}`,
    autoAction,
    ``,
    `---`,
    `*To ban this user: [click here](https://www.reddit.com/r/${subredditName}/about/banned)*`,
    `*ModShield v1.0 | Protecting r/${subredditName}*`,
  ].join('\n');

  await reddit.modMail.createConversation({
    subredditName: subredditName,
    subject: subject,
    body: body,
    isAuthorHidden: false,
  });
}