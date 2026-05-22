import { Hono } from 'hono';
import type { MenuItemRequest, UiResponse } from '@devvit/web/shared';
import type { FormField } from '@devvit/shared-types/shared/form.js';
import { getConfig, getAlerts } from '../core/network';
import { context } from '@devvit/web/server';
import { CATEGORY_LABELS } from '../core/categories';

export const menu = new Hono();

const buildNukeFields = (targetId: string): FormField[] => [
  {
    name: 'targetId',
    label: 'Target ID',
    type: 'string',
    helpText: 'Auto-filled from the selected item.',
    required: true,
    defaultValue: targetId,
  },
  {
    name: 'remove',
    label: 'Remove comments',
    type: 'boolean',
    defaultValue: true,
  },
  {
    name: 'lock',
    label: 'Lock comments',
    type: 'boolean',
    defaultValue: false,
  },
  {
    name: 'skipDistinguished',
    label: 'Skip distinguished comments',
    type: 'boolean',
    defaultValue: false,
  },
];

const buildNukeForm = (title: string, targetId: string) => ({
  fields: buildNukeFields(targetId),
  title,
  acceptLabel: 'Mop',
  cancelLabel: 'Cancel',
});

menu.post('/mop-comment', async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  console.log('request', request.targetId);
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopComment',
        form: buildNukeForm('Mop Comments', request.targetId),
      },
    },
    200
  );
});

menu.post('/mop-post', async (c) => {
  const request = await c.req.json<MenuItemRequest>();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mopPost',
        form: buildNukeForm('Mop Post Comments', request.targetId),
      },
    },
    200
  );
});

const buildSettingsForm = () => ({
  title: '🛡️ ModShield Configuration',
  description: 'Configure your cross-subreddit ban intelligence settings. Changes take effect immediately.',
  acceptLabel: 'Save Settings',
  cancelLabel: 'Cancel',
  fields: [
    {
      name: 'enabled',
      label: 'Enable ModShield (participate in network)',
      type: 'boolean',
      defaultValue: true,
    },
    {
      name: 'alertOnly',
      label: 'Alert-only mode (do not auto-ban)',
      type: 'boolean',
      defaultValue: true,
      helpText: 'When ON, ModShield only sends modmail alerts. When OFF, auto-bans are applied based on thresholds below.',
    },
    {
      name: 'notifyOnFirstFlag',
      label: 'Alert on first-ever network flag',
      type: 'boolean',
      defaultValue: true,
      helpText: 'When ON, you get an alert even if the user was only flagged by 1 subreddit.',
    },
    {
      name: 'botThreshold',
      label: 'Auto-ban threshold: Bots (# network flags)',
      type: 'number',
      defaultValue: 1,
      helpText: 'Recommended: 1 (bots are easy to verify)',
    },
    {
      name: 'scamThreshold',
      label: 'Auto-ban threshold: Scam accounts',
      type: 'number',
      defaultValue: 2,
    },
    {
      name: 'spamThreshold',
      label: 'Auto-ban threshold: Spammers',
      type: 'number',
      defaultValue: 3,
    },
    {
      name: 'harassmentThreshold',
      label: 'Auto-ban threshold: Harassment',
      type: 'number',
      defaultValue: 3,
      helpText: 'Recommended: higher threshold — context matters more for harassment',
    },
    {
      name: 'trustedSubs',
      label: 'Trusted subreddits (comma-separated, no r/)',
      type: 'string',
      defaultValue: '',
      helpText: 'e.g. space, LifeProTips, personalfinance — bans from these subs count double',
    },
  ] as FormField[],
});

menu.post('/settings', async (c) => {
  const config = await getConfig();
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'settingsForm',
        form: buildSettingsForm(),
        data: {
          enabled: config.enabled,
          alertOnly: config.alertOnly,
          notifyOnFirstFlag: config.notifyOnFirstFlag,
          botThreshold: config.thresholds.bot,
          scamThreshold: config.thresholds.scam,
          spamThreshold: config.thresholds.spam,
          harassmentThreshold: config.thresholds.harassment,
          trustedSubs: config.trustedSubs.join(', '),
        },
      },
    },
    200
  );
});

menu.post('/view-activity-log', async (c) => {
  const alerts = await getAlerts(context.subredditName ?? '');
  if (alerts.length === 0) {
    return c.json<UiResponse>(
      {
        showToast: 'No ModShield alerts recorded yet.',
      },
      200
    );
  }

  const lines = alerts.slice(0, 10).map((a) => {
    const daysAgo = Math.floor((Date.now() - a.timestamp) / 86400000);
    const action = a.actionTaken === 'auto-banned' ? '⚡ auto-banned' : '🔔 alerted';
    const categoryLabel = CATEGORY_LABELS[a.category];
    return `${action} u/${a.username.slice(0, 20)} (${categoryLabel}, ${daysAgo}d ago)`;
  });

  return c.json<UiResponse>(
    {
      showToast: lines.join('\n'),
    },
    200
  );
});

const buildQuickUnbanForm = () => ({
  title: '🛡️ ModShield: Quick Unban',
  description: 'Unban a user programmatically from this subreddit.',
  acceptLabel: 'Unban User',
  cancelLabel: 'Cancel',
  fields: [
    {
      name: 'username',
      label: 'Username',
      type: 'string',
      required: true,
      helpText: 'The Reddit username (e.g., imperial_1513, no u/)',
    },
  ] as FormField[],
});

const buildMockNetworkBanForm = (currentSub: string) => ({
  title: '🛡️ ModShield: Mock Network Ban',
  description: 'Record a mock ban in the database. This does NOT ban the user on Reddit.',
  acceptLabel: 'Mock Ban',
  cancelLabel: 'Cancel',
  fields: [
    {
      name: 'username',
      label: 'Username to Flag',
      type: 'string',
      required: true,
      helpText: 'e.g. imperial_1513',
    },
    {
      name: 'category',
      label: 'Ban Category',
      type: 'select',
      required: true,
      defaultValue: ['spam'],
      options: [
        { label: 'Spam', value: 'spam' },
        { label: 'Scam', value: 'scam' },
        { label: 'Bot', value: 'bot' },
        { label: 'Harassment', value: 'harassment' },
      ],
    },
    {
      name: 'sourceSub',
      label: 'Source Subreddit',
      type: 'string',
      required: true,
      defaultValue: currentSub,
      helpText: 'The subreddit reporting this ban',
    },
  ] as FormField[],
});

menu.post('/quick-unban', async (c) => {
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'quickUnbanForm',
        form: buildQuickUnbanForm(),
      },
    },
    200
  );
});

menu.post('/mock-network-ban', async (c) => {
  const currentSub = context.subredditName ?? 'mod_shieldd_dev';
  return c.json<UiResponse>(
    {
      showForm: {
        name: 'mockNetworkBanForm',
        form: buildMockNetworkBanForm(currentSub),
      },
    },
    200
  );
});

