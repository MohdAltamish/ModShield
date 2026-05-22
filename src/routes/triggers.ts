import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnModActionRequest,
  OnPostSubmitRequest,
  OnCommentSubmitRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';
import { getConfig, checkUser, recordBan, appendAlert } from '../core/network';
import { isTrusted, shouldAutoBan } from '../core/trust';
import { inferCategory } from '../core/categories';
import { sendModmailAlert } from '../core/alerts';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  const input = await c.req.json<OnAppInstallRequest>();
  console.log('App installed to subreddit: r/' + input.subreddit?.name);

  return c.json<TriggerResponse>(
    {
      status: 'success',
    },
    200
  );
});

triggers.post('/on-mod-action', async (c) => {
  const input = await c.req.json<OnModActionRequest>();

  if (input.action !== 'banuser') {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const username = input.targetUser?.name;
  if (!username) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const config = await getConfig();
  if (!config.enabled) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  interface BanActionPayload {
    details?: string;
    description?: string;
  }
  const banPayload = input as unknown as BanActionPayload;
  const details = banPayload.details || banPayload.description || '';
  const category = inferCategory(details);
  const sourceSub = input.subreddit?.name || context.subredditName || 'unknown';

  const record = await recordBan({
    username,
    category,
    sourceSub,
    bannedBy: input.moderator?.name ?? 'unknown',
    isTrustedSource: false,
  });

  console.log(
    `[ModShield] Ban recorded: u/${record.username} | category=${category} | sub=${sourceSub} | total_reports=${record.reportCount}`
  );

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});

triggers.post('/on-post-submit', async (c) => {
  const input = await c.req.json<OnPostSubmitRequest>();
  const username = input.author?.name;

  if (!username || username === 'AutoModerator') {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const config = await getConfig();
  if (!config.enabled) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const record = await checkUser(username);
  if (!record) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  // Calculate trusted count dynamically based on current sub's trusted subs
  const trustedReportCount = record.subreddits.filter((sub) => isTrusted(config, sub)).length;
  record.trustedReportCount = trustedReportCount;

  const subName = input.subreddit?.name || context.subredditName || '';
  const postId = input.post?.id || '';
  const postUrl = `https://reddit.com/r/${subName}/comments/${postId.replace(/^t3_/, '')}`;

  const autoBan = shouldAutoBan(config, record, record.category);

  // If not auto-banning, and notifyOnFirstFlag is false, and they only have 1 report, skip alert
  if (!autoBan && !config.notifyOnFirstFlag && record.reportCount <= 1 && trustedReportCount === 0) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  if (autoBan) {
    await reddit.banUser({
      subredditName: subName,
      username,
      reason: `[ModShield] Auto-ban: flagged by ${record.reportCount} subreddits for ${record.category}`,
    });
  }

  const actionTaken = autoBan ? 'auto-banned' : 'alerted';

  await sendModmailAlert(
    username,
    record,
    postUrl,
    actionTaken
  );

  await appendAlert(subName, {
    username,
    category: record.category,
    sourceSub: record.sourceSub,
    timestamp: Date.now(),
    postOrCommentUrl: postUrl,
    actionTaken,
  });

  console.log(
    `[ModShield] Alert sent: u/${username} posted in r/${subName} | action=${actionTaken}`
  );

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});

triggers.post('/on-comment-submit', async (c) => {
  const input = await c.req.json<OnCommentSubmitRequest>();
  const username = input.author?.name;

  if (!username || username === 'AutoModerator') {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const config = await getConfig();
  if (!config.enabled) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  const record = await checkUser(username);
  if (!record) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  // Calculate trusted count dynamically based on current sub's trusted subs
  const trustedReportCount = record.subreddits.filter((sub) => isTrusted(config, sub)).length;
  record.trustedReportCount = trustedReportCount;

  const subName = input.subreddit?.name || context.subredditName || '';
  const postId = input.comment?.postId || '';
  const commentId = input.comment?.id || '';
  const commentUrl = `https://reddit.com/r/${subName}/comments/${postId.replace(/^t3_/, '')}/_/${commentId.replace(/^t1_/, '')}`;

  const autoBan = shouldAutoBan(config, record, record.category);

  // If not auto-banning, and notifyOnFirstFlag is false, and they only have 1 report, skip alert
  if (!autoBan && !config.notifyOnFirstFlag && record.reportCount <= 1 && trustedReportCount === 0) {
    return c.json<TriggerResponse>({ status: 'success' }, 200);
  }

  if (autoBan) {
    await reddit.banUser({
      subredditName: subName,
      username,
      reason: `[ModShield] Auto-ban: flagged by ${record.reportCount} subreddits for ${record.category}`,
    });
  }

  const actionTaken = autoBan ? 'auto-banned' : 'alerted';

  await sendModmailAlert(
    username,
    record,
    commentUrl,
    actionTaken
  );

  await appendAlert(subName, {
    username,
    category: record.category,
    sourceSub: record.sourceSub,
    timestamp: Date.now(),
    postOrCommentUrl: commentUrl,
    actionTaken,
  });

  console.log(
    `[ModShield] Alert sent: u/${username} commented in r/${subName} | action=${actionTaken}`
  );

  return c.json<TriggerResponse>({ status: 'success' }, 200);
});
