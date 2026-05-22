# ModShield — Complete Build Prompt

> **Purpose of this file:** This is a self-contained engineering specification. Every file, every function, every config, every edge case is described here. Read it top to bottom once before writing a single line of code. Then follow each phase in order.

---

## 0. What You Are Building

**ModShield** is a cross-subreddit ban intelligence network built as a Reddit Devvit app. When a moderator bans a user in any participating subreddit, ModShield records that ban in a shared Redis database. Every other participating subreddit is then protected: the moment that flagged account posts or comments anywhere in the network, the mod team receives an instant modmail alert. Mods can configure alert-only mode or automatic banning based on a configurable threshold.

**The product fills the gap left by BotDefense**, which protected 3,650 subreddits before shutting down in July 2023.

### Why this is the right problem

- Spammers, bots, scammers, and harassers move freely between subreddits after being banned
- Moderators currently have no cross-subreddit visibility into bad actors
- No external API keys, servers, or infrastructure needed — Devvit provides everything (Redis, triggers, modmail, forms)

### The 8 core features (do not cut any)

| # | Feature | What it does |
|---|---------|-------------|
| 1 | **Shared ban database** | Every ban in every participating sub writes to Redis |
| 2 | **Instant modmail alerts** | Flagged user appears → mod team notified immediately |
| 3 | **Auto-ban mode** | Ban automatically if flagged by N+ subreddits |
| 4 | **Per-category settings** | Separate thresholds for spam / bot / scam / harassment |
| 5 | **Trust system** | Mark subreddits as Trusted — their bans carry extra weight |
| 6 | **Config dashboard** | Moderator-only settings panel accessible from subreddit menu |
| 7 | **Activity log** | View recent alerts and network bans from the dashboard |
| 8 | **Zero-friction install** | No API keys, no external accounts, no setup required |

---

## 1. Technology Stack

| Layer | Tool | Why |
|-------|------|-----|
| Runtime | Devvit (Reddit Developer Platform) | Native integration with Reddit APIs, no server needed |
| Language | TypeScript (strict mode) | Type safety across all Redis serialization |
| Database | Devvit Redis (built-in KV store) | Persistent, scoped per app installation |
| Triggers | Devvit event system | `ModAction`, `PostSubmit`, `CommentSubmit` |
| UI | Devvit Forms + Menu Items | Native Reddit mod UI, no custom frontend needed |
| Alerts | Reddit Modmail API via Devvit | `sendPrivateMessageAsSubreddit` |
| Logging | `devvit logs` CLI | Real-time log streaming during testing |

---

## 2. Project Structure

```
modshield/
├── src/
│   ├── main.ts           ← App entry point, all triggers + menu items
│   ├── network.ts        ← All Redis read/write operations
│   ├── alerts.ts         ← Modmail alert formatting and sending
│   ├── trust.ts          ← Trust system logic
│   ├── categories.ts     ← Ban category definitions and helpers
│   └── types.ts          ← All shared TypeScript types
├── devvit.yaml           ← App manifest: name, version, permissions
├── package.json
├── tsconfig.json
└── README.md
```

---

## 3. Complete Type Definitions — `src/types.ts`

Create this file first. Every other file imports from it.

```typescript
// src/types.ts

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
```

**Why these types matter:**
- `BanRecord.trustedReportCount` is separate from `reportCount` so trust weighting works cleanly
- `SubConfig.thresholds` is per-category so mods can auto-ban bots at threshold 1 but require 5 reports for harassment
- `AlertRecord` populates the activity log

---

## 4. Redis Schema

All data lives in Devvit's Redis. Use these exact key patterns — do not deviate or keys will collide.

| Key | Value | Purpose |
|-----|-------|---------|
| `flagged:{username}` | `JSON<BanRecord>` | Per-user network ban record |
| `config:modshield` | `JSON<SubConfig>` | Per-subreddit config |
| `log:alerts:{subredditName}` | `JSON<AlertRecord[]>` | Last 50 alerts for this sub |
| `trusted:{subredditName}` | `JSON<string[]>` | Trust list for this sub (mirrors SubConfig.trustedSubs) |

**Key design decisions:**
- User records are global across all installs — this is what makes the "network" work
- Config and logs are per-subreddit (scoped to each installation)
- `log:alerts` stores only the last 50 entries — trim on every write

---

## 5. Network Layer — `src/network.ts`

This is the most critical file. Every ban and every lookup goes through here.

```typescript
// src/network.ts
import { Devvit } from '@devvit/public-api';
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
  redis: Devvit.Context['redis'],
  input: {
    username: string;
    category: BanCategory;
    sourceSub: string;
    bannedBy: string;
    isTrustedSource: boolean;
  }
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
  redis: Devvit.Context['redis'],
  username: string
): Promise<BanRecord | null> {
  const key = `flagged:${username.toLowerCase()}`;
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data) as BanRecord;
}

// ─── CONFIG OPERATIONS ─────────────────────────────────────────────────────

export async function getConfig(
  redis: Devvit.Context['redis']
): Promise<SubConfig> {
  const raw = await redis.get('config:modshield');
  if (!raw) return DEFAULT_CONFIG;
  return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
}

export async function saveConfig(
  redis: Devvit.Context['redis'],
  config: SubConfig
): Promise<void> {
  await redis.set('config:modshield', JSON.stringify(config));
}

// ─── ACTIVITY LOG OPERATIONS ───────────────────────────────────────────────

/**
 * Append an alert to this subreddit's activity log.
 * Keeps only the most recent 50 entries (trim on write).
 */
export async function appendAlert(
  redis: Devvit.Context['redis'],
  subredditName: string,
  alert: AlertRecord
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
  redis: Devvit.Context['redis'],
  subredditName: string
): Promise<AlertRecord[]> {
  const key = `log:alerts:${subredditName}`;
  const raw = await redis.get(key);
  if (!raw) return [];
  return JSON.parse(raw) as AlertRecord[];
}
```

---

## 6. Trust System — `src/trust.ts`

```typescript
// src/trust.ts
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
  return regularReports + record.trustedReportCount * 2;
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
```

---

## 7. Category Helpers — `src/categories.ts`

```typescript
// src/categories.ts
import { BanCategory } from './types';

/**
 * Infer ban category from the moderator's ban note/reason text.
 * Scans for keywords. Falls back to 'spam'.
 */
export function inferCategory(modNote: string): BanCategory {
  const note = modNote.toLowerCase();
  if (note.includes('bot') || note.includes('automated')) return 'bot';
  if (note.includes('scam') || note.includes('fraud') || note.includes('phish')) return 'scam';
  if (note.includes('harass') || note.includes('threat') || note.includes('abuse')) return 'harassment';
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
```

---

## 8. Alert System — `src/alerts.ts`

```typescript
// src/alerts.ts
import { Devvit } from '@devvit/public-api';
import { BanRecord, AlertRecord } from './types';
import { CATEGORY_LABELS, CATEGORY_EMOJI } from './categories';
import { effectiveScore } from './trust';

export async function sendModmailAlert(
  context: Devvit.Context,
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
    `*To ban this user: [click here](https://www.reddit.com/r/${subredditName}/about/banned) and add u/${username}*`,
    `*ModShield v1.0 | Protecting r/${subredditName}*`,
  ].join('\n');

  await context.reddit.sendPrivateMessageAsSubreddit({
    fromSubredditName: subredditName,
    to: `r/${subredditName}`,
    subject,
    text: body,
  });
}
```

---

## 9. Main App — `src/main.ts`

```typescript
// src/main.ts
import { Devvit } from '@devvit/public-api';
import {
  recordBan,
  checkUser,
  getConfig,
  saveConfig,
  appendAlert,
  getAlerts,
} from './network';
import { sendModmailAlert } from './alerts';
import { isTrusted, shouldAutoBan } from './trust';
import { inferCategory, CATEGORY_LABELS } from './categories';
import { BanCategory, SubConfig } from './types';

// ─── APP BOOTSTRAP ─────────────────────────────────────────────────────────

Devvit.configure({
  redditAPI: true,
  redis: true,
});

// ─── TRIGGER: ModAction (ban events) ───────────────────────────────────────

Devvit.addTrigger({
  event: 'ModAction',
  onEvent: async (event, context) => {
    if (event.action !== 'banuser') return;
    if (!event.targetUser?.name) return;

    const config = await getConfig(context.redis);
    if (!config.enabled) return;

    const category = inferCategory(event.details ?? '');
    const sourceSub = context.subredditName ?? 'unknown';

    const record = await recordBan(context.redis, {
      username: event.targetUser.name,
      category,
      sourceSub,
      bannedBy: event.moderator?.name ?? 'unknown',
      isTrustedSource: false,
    });

    console.log(
      `[ModShield] Ban recorded: u/${record.username} | category=${category} | sub=${sourceSub} | total_reports=${record.reportCount}`
    );
  },
});

// ─── TRIGGER: PostSubmit ────────────────────────────────────────────────────

Devvit.addTrigger({
  event: 'PostSubmit',
  onEvent: async (event, context) => {
    if (!event.author?.name) return;

    const config = await getConfig(context.redis);
    if (!config.enabled) return;

    if (event.author.name === 'AutoModerator') return;

    const record = await checkUser(context.redis, event.author.name);
    if (!record) return;

    if (isTrusted(config, record.sourceSub)) {
      record.trustedReportCount = Math.max(record.trustedReportCount, 1);
    }

    const postUrl = `https://reddit.com/r/${context.subredditName}/comments/${event.post.id}`;
    const autoBan = shouldAutoBan(config, record, record.category);

    if (autoBan) {
      await context.reddit.banUser({
        subredditName: context.subredditName ?? '',
        username: event.author.name,
        reason: `[ModShield] Auto-ban: flagged by ${record.reportCount} subreddits for ${record.category}`,
      });
    }

    await sendModmailAlert(
      context,
      event.author.name,
      record,
      postUrl,
      autoBan ? 'auto-banned' : 'alerted'
    );

    await appendAlert(context.redis, context.subredditName ?? '', {
      username: event.author.name,
      category: record.category,
      sourceSub: record.sourceSub,
      timestamp: Date.now(),
      postOrCommentUrl: postUrl,
      actionTaken: autoBan ? 'auto-banned' : 'alerted',
    });

    console.log(
      `[ModShield] Alert sent: u/${event.author.name} posted in r/${context.subredditName} | action=${autoBan ? 'auto-banned' : 'alerted'}`
    );
  },
});

// ─── TRIGGER: CommentSubmit ─────────────────────────────────────────────────

Devvit.addTrigger({
  event: 'CommentSubmit',
  onEvent: async (event, context) => {
    if (!event.author?.name) return;

    const config = await getConfig(context.redis);
    if (!config.enabled) return;

    if (event.author.name === 'AutoModerator') return;

    const record = await checkUser(context.redis, event.author.name);
    if (!record) return;

    if (isTrusted(config, record.sourceSub)) {
      record.trustedReportCount = Math.max(record.trustedReportCount, 1);
    }

    const commentUrl = `https://reddit.com/r/${context.subredditName}/comments/${event.comment.postId}/_/${event.comment.id}`;
    const autoBan = shouldAutoBan(config, record, record.category);

    if (autoBan) {
      await context.reddit.banUser({
        subredditName: context.subredditName ?? '',
        username: event.author.name,
        reason: `[ModShield] Auto-ban: flagged by ${record.reportCount} subreddits for ${record.category}`,
      });
    }

    await sendModmailAlert(
      context,
      event.author.name,
      record,
      commentUrl,
      autoBan ? 'auto-banned' : 'alerted'
    );

    await appendAlert(context.redis, context.subredditName ?? '', {
      username: event.author.name,
      category: record.category,
      sourceSub: record.sourceSub,
      timestamp: Date.now(),
      postOrCommentUrl: commentUrl,
      actionTaken: autoBan ? 'auto-banned' : 'alerted',
    });
  },
});

// ─── MENU ITEM: ModShield Settings ─────────────────────────────────────────

Devvit.addMenuItem({
  label: '🛡️ ModShield Settings',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const config = await getConfig(context.redis);
    context.ui.showForm(settingsForm, {
      enabled: config.enabled,
      alertOnly: config.alertOnly,
      notifyOnFirstFlag: config.notifyOnFirstFlag,
      spamThreshold: config.thresholds.spam,
      botThreshold: config.thresholds.bot,
      scamThreshold: config.thresholds.scam,
      harassmentThreshold: config.thresholds.harassment,
      trustedSubs: config.trustedSubs.join(', '),
    });
  },
});

// ─── MENU ITEM: View Activity Log ──────────────────────────────────────────

Devvit.addMenuItem({
  label: '🛡️ ModShield Activity Log',
  location: 'subreddit',
  forUserType: 'moderator',
  onPress: async (_event, context) => {
    const alerts = await getAlerts(context.redis, context.subredditName ?? '');
    if (alerts.length === 0) {
      context.ui.showToast('No ModShield alerts recorded yet.');
      return;
    }

    const lines = alerts.slice(0, 10).map((a) => {
      const daysAgo = Math.floor((Date.now() - a.timestamp) / 86400000);
      const action = a.actionTaken === 'auto-banned' ? '⚡ auto-banned' : '🔔 alerted';
      return `${action} u/${a.username.slice(0, 20)} (${CATEGORY_LABELS[a.category]}, ${daysAgo}d ago)`;
    });

    context.ui.showToast(lines.join('\n'));
  },
});

// ─── FORM: Settings ─────────────────────────────────────────────────────────

const settingsForm = Devvit.createForm(
  {
    title: '🛡️ ModShield Configuration',
    description:
      'Configure your cross-subreddit ban intelligence settings. Changes take effect immediately.',
    acceptLabel: 'Save Settings',
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
        helpText:
          'When ON, ModShield only sends modmail alerts. When OFF, auto-bans are applied based on thresholds below.',
      },
      {
        name: 'notifyOnFirstFlag',
        label: 'Alert on first-ever network flag',
        type: 'boolean',
        defaultValue: true,
        helpText:
          'When ON, you get an alert even if the user was only flagged by 1 subreddit.',
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
        helpText:
          'Recommended: higher threshold — context matters more for harassment',
      },
      {
        name: 'trustedSubs',
        label: 'Trusted subreddits (comma-separated, no r/)',
        type: 'string',
        defaultValue: '',
        helpText:
          'e.g. space, LifeProTips, personalfinance — bans from these subs count double',
      },
    ],
  },
  async (event, context) => {
    const trustedSubsRaw = String(event.values.trustedSubs ?? '');
    const trustedSubs = trustedSubsRaw
      .split(',')
      .map((s) => s.trim().toLowerCase().replace(/^r\//, ''))
      .filter(Boolean);

    const config: SubConfig = {
      enabled: Boolean(event.values.enabled),
      alertOnly: Boolean(event.values.alertOnly),
      notifyOnFirstFlag: Boolean(event.values.notifyOnFirstFlag),
      thresholds: {
        bot: Number(event.values.botThreshold) || 1,
        scam: Number(event.values.scamThreshold) || 2,
        spam: Number(event.values.spamThreshold) || 3,
        harassment: Number(event.values.harassmentThreshold) || 3,
      },
      trustedSubs,
    };

    await saveConfig(context.redis, config);
    context.ui.showToast('✅ ModShield settings saved!');
  }
);

export default Devvit;
```

---

## 10. App Manifest — `devvit.yaml`

```yaml
name: modshield
version: 1.0.0
description: >
  Cross-subreddit ban intelligence network. When you ban a bad actor,
  the entire ModShield network is protected. Instant modmail alerts.
  Optional auto-banning. Zero setup.

permissions:
  - modMail
  - modPosts
  - modContributors
  - modActions
  - redditAPI:read
  - redditAPI:write

products: []
```

---

## 11. TypeScript Config — `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

## 12. README.md

```markdown
# 🛡️ ModShield

**Cross-subreddit ban intelligence for Reddit moderators.**

ModShield fills the gap left by BotDefense. When you ban a spammer, bot, scammer,
or harasser in your subreddit, that ban is logged to the ModShield network. Every
other participating subreddit is then protected: if that flagged account shows up
anywhere in the network, the mod team is immediately notified.

## Features

- **Shared ban network** — Every participating subreddit protects every other
- **Instant modmail alerts** — Who flagged them, which sub, why, and when
- **Auto-ban mode** — Optional: auto-ban if flagged by N+ subreddits
- **Per-category thresholds** — Different rules for spam, bots, scams, harassment
- **Trust system** — Mark subreddits as trusted; their bans carry more weight
- **Settings panel** — Full config from your subreddit menu
- **Activity log** — See the last 10 alerts in your subreddit
- **Zero friction** — No API keys, no external accounts, one-click install

## How to use

1. Install ModShield from the App Directory
2. Open **Mod Tools → 🛡️ ModShield Settings**
3. Configure your thresholds and trusted subreddits
4. Done — ModShield runs silently in the background

## Privacy

ModShield only stores Reddit usernames and the reason/subreddit of their first ban.
No post content, no personal data, no external transmission.
All data lives in Reddit's own infrastructure via Devvit Redis.
```

---

## 13. Step-by-Step Build Order

Follow these phases exactly. Each phase ends with a testable checkpoint.

### Phase 0 — Environment (30 min)

```bash
# Install Node.js v18+ from nodejs.org if not installed
node --version   # must be >= 18

# Install Devvit CLI globally
npm install -g devvit

# Verify
devvit --version

# Log in with your Reddit account (browser window opens)
devvit login
```

**Checkpoint:** `devvit --version` prints a version number. `devvit login` completes without error.

---

### Phase 1 — Scaffold (15 min)

```bash
devvit new modshield
cd modshield
```

Replace all generated files with the files from this spec (start with `types.ts`,
then `network.ts`, `trust.ts`, `categories.ts`, `alerts.ts`, `main.ts`).

Update `devvit.yaml` with the manifest from Section 10.

```bash
npm install
npx tsc --noEmit   # Must produce zero errors before continuing
```

**Checkpoint:** TypeScript compiler reports 0 errors.

---

### Phase 2 — Test subreddit (10 min)

Create a brand new public subreddit at reddit.com (e.g. `r/modshield_test`).
You must be the moderator. It must have fewer than 200 members.

```bash
devvit upload
devvit install modshield r/modshield_test
```

**Checkpoint:** Both commands complete without error. App appears in subreddit menu.

---

### Phase 3 — Smoke test (20 min)

1. Go to `r/modshield_test` as moderator
2. Ban a throwaway test account with note "bot test"
3. Log in as the test account
4. Submit a post to `r/modshield_test`
5. Log back into your mod account
6. Check modmail — you should see a ModShield alert

```bash
devvit logs r/modshield_test   # Watch logs in real time during test
```

**Checkpoint:** Modmail alert received. Logs show ban record and alert send.

---

### Phase 4 — Config test (10 min)

1. Open subreddit menu → **🛡️ ModShield Settings**
2. Toggle **alert-only mode OFF**
3. Set bot threshold to **1**
4. Add a trusted sub
5. Click Save
6. Unban the test account, then ban them again
7. Log in as test account, post again
8. Verify: auto-ban was applied (test account can't post)

**Checkpoint:** Auto-ban works. Config saves correctly.

---

### Phase 5 — Activity log test (5 min)

1. Open subreddit menu → **🛡️ ModShield Activity Log**
2. Toast should show recent alerts

**Checkpoint:** Activity log shows the alerts from Phase 3 and 4.

---

### Phase 6 — Publish

```bash
# Confirm version is 1.0.0 in devvit.yaml
devvit publish
```

App live at: `https://developers.reddit.com/apps/modshield`

---

## 14. Error Reference

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Permission denied` on modmail | Missing `modMail` permission | Add to `devvit.yaml` permissions |
| Trigger fires but Redis write fails | `redis: true` not in `Devvit.configure()` | Add it |
| `sendPrivateMessageAsSubreddit` fails | Subreddit doesn't have modmail enabled | Enable modmail in subreddit settings |
| TypeScript error on `event.action` | Devvit type mismatch | Add `as string` cast or check Devvit version |
| App installs but menu item not visible | `forUserType: 'moderator'` — not logged in as mod | Log in as moderator |
| Ban trigger not firing | Devvit doesn't receive `ModAction` for some UI paths | Use the ban form, not old-UI ban button |
| `devvit upload` fails with auth error | Token expired | Run `devvit login` again |
| Auto-ban applies but still shows alert | Both always run | Expected behavior |
| Toast cut off in activity log | Long usernames | Already handled: `a.username.slice(0, 20)` |

---

## 15. Devpost Submission Copy

### Project Title
ModShield — Cross-Subreddit Ban Intelligence Network

### Tool Overview (use verbatim)
ModShield is a federated ban intelligence network for Reddit moderators. When a mod bans a user in any participating subreddit, ModShield logs that ban to a shared network database. The next time that flagged account posts or comments in any other participating subreddit, the mod team instantly receives a modmail alert — showing who flagged the account, which subreddit, why, and when. Mods can configure per-category thresholds (bots auto-banned at 1 flag, spammers at 3), mark other subreddits as Trusted so their bans carry extra weight, and toggle between alert-only and auto-action mode. A simple settings panel and activity log are accessible directly from the subreddit menu.

### Project Impact (use verbatim)
ModShield directly replaces BotDefense — the volunteer anti-bot service that protected 3,650 subreddits before shutting down in July 2023. Target communities include r/space (23.5M members, explicitly impacted when BotDefense shut down), r/LifeProTips (22.2M members, heavily targeted by karma-farming bots), and r/personalfinance (heavily targeted by scam accounts). A mid-size subreddit spending 3 hours/week manually tracking repeat spammers saves that time entirely with ModShield. Across 100 participating subreddits, ModShield could save 300+ mod-hours per week while protecting millions of community members from coordinated bad actors.

---

## 16. Demo Video Script (60 seconds)

| Time | What to show | What to say |
|------|-------------|-------------|
| 0–5s | Title card: "ModShield" | "Every day, spammers banned in one subreddit post freely in others. ModShield fixes that." |
| 5–18s | Mod bans test user in test sub | "When a mod bans a bad actor, ModShield records it to a shared network instantly." |
| 18–33s | Log in as test user, post in same sub; cut to mod account modmail | "The next time that user posts anywhere in the network — instant modmail alert. Who flagged them, where, why, and when." |
| 33–45s | Open ModShield Settings form | "Mods control everything: per-category thresholds, trusted subreddits, alert-only or auto-ban mode." |
| 45–55s | Open Activity Log toast | "Full activity log — every alert your subreddit has received." |
| 55–60s | App Directory listing | "One install. Zero setup. The cross-subreddit protection Reddit's been missing since BotDefense shut down." |

---

## 17. Final Checklist Before Submission

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] All 6 source files exist: `types.ts`, `network.ts`, `trust.ts`, `categories.ts`, `alerts.ts`, `main.ts`
- [ ] `devvit.yaml` has all required permissions listed
- [ ] Ban trigger records correctly (verified via `devvit logs`)
- [ ] PostSubmit trigger sends modmail alert (verified manually)
- [ ] CommentSubmit trigger sends modmail alert (verified manually)
- [ ] Settings form saves and loads correctly
- [ ] Activity log shows last 10 alerts
- [ ] Auto-ban mode works when `alertOnly: false`
- [ ] Trust system: trusted sub flag → score doubles
- [ ] `devvit publish` succeeded
- [ ] App URL confirmed: `https://developers.reddit.com/apps/modshield`
- [ ] Demo video is under 60 seconds
- [ ] Devpost submission filled with copy from Section 15

---

*End of prompt. Start with Phase 0. Come back with any error messages and debug from Section 14.*
