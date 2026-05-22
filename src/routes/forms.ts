import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';
import { isT1, isT3 } from '@devvit/shared-types/tid.js';
import { handleNuke, handleNukePost } from '../core/nuke';
import { saveConfig, recordBan } from '../core/network';
import type { SubConfig, BanCategory } from '../core/types';

type NukeFormValues = {
  remove?: boolean;
  lock?: boolean;
  skipDistinguished?: boolean;
  targetId?: string;
};

export const forms = new Hono();

const normalizeValues = (values: NukeFormValues) => ({
  remove: Boolean(values.remove),
  lock: Boolean(values.lock),
  skipDistinguished: Boolean(values.skipDistinguished),
});

const getTargetId = (values: NukeFormValues) => {
  if (typeof values.targetId === 'string' && values.targetId.trim()) {
    return values.targetId.trim();
  }

  return context.postId;
};

forms.post('/mop-comment-submit', async (c) => {
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  const normalized = normalizeValues(values);

  if (!normalized.lock && !normalized.remove) {
    return c.json<UiResponse>(
      {
        showToast: 'You must select either lock or remove.',
      },
      200
    );
  }

  const targetId = getTargetId(values);
  if (!isT1(targetId)) {
    console.error('targetId is not a T1', targetId);
    return c.json<UiResponse>(
      {
        showToast: 'Mop failed! Please try again later.',
      },
      200
    );
  }

  const result = await handleNuke({
    ...normalized,
    commentId: targetId,
    subredditId: context.subredditId,
  });

  console.log(
    `Mop result - ${result.success ? 'success' : 'fail'} - ${result.message}`
  );

  return c.json<UiResponse>(
    {
      showToast: `${result.success ? 'Success' : 'Failed'} : ${result.message}`,
    },
    200
  );
});

forms.post('/mop-post-submit', async (c) => {
  const values = await c.req.json<NukeFormValues>();
  console.log('values', values);
  const normalized = normalizeValues(values);

  if (!normalized.lock && !normalized.remove) {
    return c.json<UiResponse>(
      {
        showToast: 'You must select either lock or remove.',
      },
      200
    );
  }

  const targetId = getTargetId(values);
  if (!isT3(targetId)) {
    console.error('targetId is not a T3', targetId);
    return c.json<UiResponse>(
      {
        showToast: 'Mop failed! Please try again later.',
      },
      200
    );
  }

  const result = await handleNukePost({
    ...normalized,
    postId: targetId,
    subredditId: context.subredditId,
  });

  console.log(
    `Mop result - ${result.success ? 'success' : 'fail'} - ${result.message}`
  );

  return c.json<UiResponse>(
    {
      showToast: `${result.success ? 'Success' : 'Failed'} : ${result.message}`,
    },
    200
  );
});

type SettingsFormValues = {
  enabled?: boolean;
  alertOnly?: boolean;
  notifyOnFirstFlag?: boolean;
  botThreshold?: number;
  scamThreshold?: number;
  spamThreshold?: number;
  harassmentThreshold?: number;
  trustedSubs?: string;
};

forms.post('/settings-form-submit', async (c) => {
  const values = await c.req.json<SettingsFormValues>();
  
  const trustedSubsRaw = String(values.trustedSubs ?? '');
  const trustedSubs = trustedSubsRaw
    .split(',')
    .map((s) => s.trim().toLowerCase().replace(/^r\//, ''))
    .filter(Boolean);

  const config: SubConfig = {
    enabled: values.enabled !== undefined ? Boolean(values.enabled) : true,
    alertOnly: values.alertOnly !== undefined ? Boolean(values.alertOnly) : true,
    notifyOnFirstFlag: values.notifyOnFirstFlag !== undefined ? Boolean(values.notifyOnFirstFlag) : true,
    thresholds: {
      bot: Number(values.botThreshold) || 1,
      scam: Number(values.scamThreshold) || 2,
      spam: Number(values.spamThreshold) || 3,
      harassment: Number(values.harassmentThreshold) || 3,
    },
    trustedSubs,
  };

  await saveConfig(config);

  return c.json<UiResponse>(
    {
      showToast: '✅ ModShield settings saved!',
    },
    200
  );
});

type QuickUnbanFormValues = {
  username?: string;
};

forms.post('/quick-unban-submit', async (c) => {
  const values = await c.req.json<QuickUnbanFormValues>();
  const username = values.username?.trim();

  if (!username) {
    return c.json<UiResponse>(
      {
        showToast: '❌ Username is required.',
      },
      200
    );
  }

  const subName = context.subredditName ?? '';
  try {
    await reddit.unbanUser(username, subName);
    console.log(`[ModShield] Quick Unban executed for u/${username} in r/${subName}`);
    return c.json<UiResponse>(
      {
        showToast: `✅ Successfully unbanned u/${username}!`,
      },
      200
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ModShield] Failed to unban u/${username}:`, error);
    return c.json<UiResponse>(
      {
        showToast: `❌ Failed to unban u/${username}: ${errorMsg}`,
      },
      200
    );
  }
});

type MockNetworkBanFormValues = {
  username?: string;
  category?: string | string[];
  sourceSub?: string;
};

forms.post('/mock-network-ban-submit', async (c) => {
  const values = await c.req.json<MockNetworkBanFormValues>();
  const username = values.username?.trim();
  const sourceSub = values.sourceSub?.trim() || 'unknown';

  const catVal = Array.isArray(values.category) ? values.category[0] : values.category;
  const category = (catVal?.trim().toLowerCase() || 'spam') as BanCategory;

  if (!username) {
    return c.json<UiResponse>(
      {
        showToast: '❌ Username is required.',
      },
      200
    );
  }

  try {
    const record = await recordBan({
      username,
      category,
      sourceSub,
      bannedBy: 'mock_moderator',
      isTrustedSource: false,
    });

    console.log(
      `[ModShield] Mock Ban recorded: u/${record.username} | category=${category} | sub=${sourceSub} | total_reports=${record.reportCount}`
    );

    return c.json<UiResponse>(
      {
        showToast: `✅ Mock network ban recorded for u/${username} (Category: ${category})!`,
      },
      200
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[ModShield] Failed to record mock ban:`, error);
    return c.json<UiResponse>(
      {
        showToast: `❌ Failed to record mock ban: ${errorMsg}`,
      },
      200
    );
  }
});
