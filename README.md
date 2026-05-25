# 🛡️ ModShield

> **Cross-subreddit ban intelligence for Reddit moderators. When one subreddit bans a bad actor, every other participating subreddit is instantly protected.**

[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](LICENSE)
[![Built with Devvit](https://img.shields.io/badge/Built%20with-Devvit-orange)](https://developers.reddit.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Version](https://img.shields.io/badge/version-0.0.9-brightgreen)](https://developers.reddit.com/apps/modshield-bot)
[![Status](https://img.shields.io/badge/Status-Public-success)](https://developers.reddit.com/apps/modshield-bot)
[![Test Community](https://img.shields.io/badge/Test%20Community-r%2Fmodshield__bot-FF4500?logo=reddit)](https://www.reddit.com/r/modshield_bot)

---

## 📖 Table of Contents

- [Live App & Test Community](#-live-app--test-community)
- [What is ModShield?](#-what-is-modshield)
- [The Problem It Solves](#-the-problem-it-solves)
- [How It Works — Plain English](#-how-it-works--plain-english)
- [Features](#-features)
- [How ModShield Differs From Other Tools](#-how-modshield-differs-from-other-tools)
- [Getting Started](#-getting-started)
- [Configuration Guide](#%EF%B8%8F-configuration-guide)
- [The Trust System Explained](#-the-trust-system-explained)
- [Alert Format](#-alert-format)
- [Project Structure](#-project-structure)
- [Architecture Deep-Dive](#-architecture-deep-dive)
- [Commands Reference](#-commands-reference)
- [Privacy](#-privacy)
- [Contributing](#-contributing)

---

## 🚀 Live App & Test Community

ModShield is **live, deployed, and publicly available** on Reddit. You can explore it right now:

| | Link |
|---|---|
| 🛍️ **App Directory** | [developers.reddit.com/apps/modshield-bot](https://developers.reddit.com/apps/modshield-bot) |
| 🧪 **Test Community** | [r/modshield_bot](https://www.reddit.com/r/modshield_bot) |
| 📦 **Current Version** | `0.0.9` |
| 🌐 **Visibility** | **Public** — available to all Reddit moderators |

### Try it out

1. Join [r/modshield_bot](https://www.reddit.com/r/modshield_bot) — the official test subreddit
2. If you're a moderator, open the community menu (⋯) to see all 🛡️ ModShield tools
3. Create a test post or comment to trigger the network detection system

---

## 🧩 What is ModShield?

ModShield is a **Reddit Devvit app** that creates a shared intelligence network across multiple subreddits. It is a **cross-subreddit ban tracking and alerting system** that runs entirely inside Reddit's own infrastructure — no external servers, no API keys, no third-party accounts needed.

Think of it like a neighbourhood watch program for Reddit communities. When one moderator spots and bans a bad actor, every other participating community is quietly told: *"Watch out — this person was already flagged."*

ModShield was built to **fill the gap left by BotDefense**, a popular tool that protected over 3,650 subreddits before it shut down in July 2023.

---

## 🔥 The Problem It Solves

Reddit is made of thousands of independent communities (subreddits), each moderated by volunteers. These communities have no native way to share information about bad actors.

**What happens today without ModShield:**

1. A spammer is banned from r/technology after posting junk links.
2. They immediately move to r/science, r/gaming, r/AskReddit and do the same thing.
3. Each of those communities has to discover the problem from scratch, ban the person manually, and has no idea this person has already been flagged elsewhere.
4. The spammer can bounce between hundreds of subreddits for weeks before being stopped.

**What happens with ModShield:**

1. A spammer is banned from r/technology — ModShield records it automatically.
2. The moment that same account posts or comments in **any** participating subreddit, the mod team there receives an **instant modmail alert** with full details.
3. If the subreddit has auto-ban mode on, the ban happens automatically. No human intervention needed.

---

## 🧠 How It Works — Plain English

Here's the full lifecycle in simple steps:

### Step 1 — A mod bans someone
A moderator in a participating subreddit bans a user (for spam, scam, bot activity, or harassment). ModShield detects this ban automatically through Reddit's event system. No extra action is needed from the mod.

### Step 2 — The ban is recorded to the network
ModShield writes that ban to a shared Redis database (built into Reddit's platform). It records:
- The username of the banned person
- Which subreddit banned them
- Why they were banned (inferred from the ban note)
- Who the moderator was
- The exact time

### Step 3 — The flagged user shows up elsewhere
That same account makes a post or comment in another subreddit that has ModShield installed.

### Step 4 — The alert fires instantly
ModShield checks every new post and comment against the flagged user database. If there's a match, it sends a modmail to that subreddit's mod team with full context:
- What they were originally banned for
- Where (which subreddit) they were first flagged
- How many subreddits have flagged them
- Whether any "trusted" subreddits were among them
- A direct link to the new post/comment

### Step 5 — Action is taken
Depending on the subreddit's settings:
- **Alert-only mode**: The mod team sees the alert and decides what to do.
- **Auto-ban mode**: ModShield bans the user automatically if they've been flagged enough times (configurable per category).

---

## ✨ Features

### 1. 🌐 Shared Ban Network
Every subreddit that installs ModShield participates in a shared intelligence database. When any participating subreddit bans a user, that information becomes available to all others. The more subreddits that join, the stronger the network.

### 2. 📬 Instant Modmail Alerts
When a flagged user appears in your subreddit, you receive a formatted modmail message with a complete breakdown:
- Ban category and emoji
- Which subreddit flagged them first
- How many days ago they were first flagged
- Total number of flagging subreddits
- How many of those are "trusted" subreddits
- The network score (used for auto-ban decisions)
- A direct link to the offending post or comment

### 3. ⚡ Auto-Ban Mode
Optional: if a user has been flagged by enough subreddits, ModShield bans them automatically without any moderator action. The threshold is fully configurable per ban category.

### 4. 🏷️ Per-Category Thresholds
ModShield understands that not all bans are equal. It tracks four categories:
- 🤖 **Bot** — Automated accounts. Default threshold: 1 (very easy to verify, ban immediately)
- 💸 **Scam** — Fraudulent or phishing accounts. Default threshold: 2
- 🗑️ **Spam** — Spammers. Default threshold: 3
- 🚨 **Harassment** — Harassing or abusive accounts. Default threshold: 3 (higher because context matters more)

Each category can have its own separate auto-ban threshold.

### 5. ⭐ Trust System
You can mark specific subreddits as **trusted**. When a flagged user's ban came from a trusted subreddit, it counts double in the network score calculation.

**Example:**
- A user flagged by 2 regular subreddits = score of 2
- A user flagged by 1 trusted subreddit + 1 regular = score of 3 (trusted counts double)

This allows subreddits that you know are well-moderated to carry extra weight.

### 6. ⚙️ Config Dashboard
Moderators can configure all settings directly from the Reddit subreddit menu (no external website, no command-line tools). Settings include:
- Enable/disable ModShield participation
- Alert-only vs auto-ban mode
- Per-category thresholds
- Trusted subreddit list
- Whether to alert on the very first flag ever

### 7. 📋 Activity Log
From the subreddit menu, moderators can view the last 10 alerts received by their subreddit — showing who was flagged, what for, how long ago, and what action was taken.

### 8. 🧹 Bulk Comment Management (Mop)
ModShield also includes a built-in **Mop** tool for bulk comment management:
- **Mop comments**: Remove a comment and all its child replies in one click
- **Mop post comments**: Remove or lock all comments on an entire post
- Options to skip "distinguished" (mod/admin) comments
- Available from the right-click context menu on posts and comments

### 9. 🔧 Developer Tools
Built-in moderator utilities for testing and maintenance:
- **Mock Network Ban**: Record a fake ban in the database for testing, without actually banning anyone on Reddit
- **Quick Unban**: Quickly unban a user programmatically directly from the mod tools menu

### 10. 🚫 Zero-Friction Install
No API keys. No external accounts. No servers to manage. No configuration required on day 1. Install it, and it works.

---

## 🆚 How ModShield Differs From Other Tools

This is the section most people ask about. Let's compare ModShield directly to the existing tools in the Reddit moderation ecosystem.

---

### vs. BotDefense (shut down July 2023)

| | BotDefense | ModShield |
|---|---|---|
| **Status** | ❌ Shut down | ✅ Active |
| **Infrastructure** | Required external servers | Runs 100% inside Reddit (Devvit) |
| **Setup** | Required external sign-up | One-click install from App Directory |
| **Network sharing** | ✅ Yes | ✅ Yes |
| **Custom thresholds per category** | ❌ No | ✅ Yes (spam/bot/scam/harassment) |
| **Trust system** | ❌ No | ✅ Yes (trusted subs count double) |
| **Auto-ban mode** | ✅ Yes | ✅ Yes (with per-category control) |
| **Alert-only mode** | ✅ Yes | ✅ Yes |
| **Category-based ban detection** | ❌ No | ✅ Yes (auto-inferred from ban notes) |
| **Per-subreddit config panel** | ❌ No | ✅ Yes (native Reddit UI) |
| **Activity log** | ❌ No | ✅ Yes (last 50 alerts stored) |
| **Bulk comment tools** | ❌ No | ✅ Yes (Mop) |
| **External dependency** | Bot account + server | None |

**Bottom line:** ModShield picks up exactly where BotDefense left off, adds features BotDefense never had, and requires zero external infrastructure.

---

### vs. Mod Toolbox (browser extension)

| | Mod Toolbox | ModShield |
|---|---|---|
| **Type** | Browser extension | Reddit app (server-side) |
| **Works on mobile** | ❌ No | ✅ Yes |
| **Works without extra installs** | ❌ No (extension required) | ✅ Yes |
| **Cross-subreddit ban sharing** | ❌ No | ✅ Yes |
| **Automatic triggers** | ❌ No (manual only) | ✅ Yes (auto on post/comment) |
| **Auto-ban** | ❌ No | ✅ Yes |
| **Real-time alerts** | ❌ No | ✅ Yes |
| **Mod notes** | ✅ Yes | ❌ No (out of scope) |
| **User notes** | ✅ Yes | ❌ No |

**Bottom line:** Mod Toolbox is a great personal utility for individual mods. ModShield is a network-level protection system. They solve completely different problems and can be used together.

---

### vs. AutoModerator (Reddit's built-in)

| | AutoModerator | ModShield |
|---|---|---|
| **Type** | Rule-based text filter | Cross-subreddit intelligence network |
| **Cross-subreddit awareness** | ❌ No | ✅ Yes |
| **Ban intelligence** | ❌ No | ✅ Yes |
| **Pattern/keyword filtering** | ✅ Yes | ❌ No (out of scope) |
| **Real-time ban alerts** | ❌ No | ✅ Yes |
| **Auto-ban based on network bans** | ❌ No | ✅ Yes |
| **Trust scoring** | ❌ No | ✅ Yes |

**Bottom line:** AutoModerator filters content inside one subreddit. ModShield tracks bad actors across all subreddits. They work at completely different layers and complement each other perfectly.

---

### vs. Reddit's native Ban feature

Reddit's built-in ban system is per-subreddit and completely isolated. When you ban someone on Reddit, **nothing** happens in any other community. ModShield wraps around this and creates the cross-subreddit layer Reddit itself doesn't provide.

---

### vs. Snoovatar / other Devvit apps

Most existing Devvit apps are UI/flair/post-formatting tools. **ModShield is one of the very few Devvit apps focused entirely on cross-subreddit moderation safety.** It uses Devvit's trigger system (not just UI widgets) to run server-side logic on every post and comment across every participating subreddit.

---

## 🚀 Getting Started

### Prerequisites

- Node.js v22.2.0 or higher
- A Reddit account with moderator access to at least one subreddit
- The Devvit CLI (`npx` is sufficient — no global install required)

### 1. Install the Devvit CLI (optional — global install)

```bash
npm install -g devvit
```

Or use it directly with `npx` (no install needed):

```bash
npx devvit --version
```

### 2. Log in to Reddit via Devvit

```bash
npx devvit login
```

This opens a browser window to authenticate your Reddit account.

### 3. Clone the repository

```bash
git clone https://github.com/MohdAltamish/mod-shield.git
cd mod-shield
```

### 4. Install dependencies

```bash
npm install
```

### 5. Configure your development subreddit

Open `devvit.json` and update the dev subreddit name to a subreddit you moderate:

```json
"dev": {
  "subreddit": "modshield_bot"
}
```

> The official test community is [r/modshield_bot](https://www.reddit.com/r/modshield_bot). Replace this with your own subreddit if you're running a private fork.

### 6. Start development mode

```bash
npm run dev
# or directly:
npx devvit playtest r/modshield_bot
```

This runs the Devvit playtest, which hot-deploys your app to your dev subreddit and streams live server logs to your terminal so you can debug in real time.

### 7. Open Reddit and test

Go to your subreddit. In the subreddit menu (the three-dot menu or mod tools), you should see the **🛡️ ModShield Settings** and **🛡️ ModShield Activity Log** options.

---

## ⚙️ Configuration Guide

Access configuration by going to your subreddit → Mod Tools → **🛡️ ModShield Settings**.

| Setting | What it does | Default |
|---|---|---|
| **Enable ModShield** | Whether this subreddit participates in the network at all | `true` |
| **Alert-only mode** | When ON, never auto-bans. Only sends modmail. | `true` |
| **Alert on first flag** | Send modmail even if the user was only flagged by 1 subreddit | `true` |
| **Bot threshold** | Auto-ban bots after this many network flags | `1` |
| **Scam threshold** | Auto-ban scammers after this many flags | `2` |
| **Spam threshold** | Auto-ban spammers after this many flags | `3` |
| **Harassment threshold** | Auto-ban harassers after this many flags | `3` |
| **Trusted subreddits** | Comma-separated list of subreddits whose bans count double | _(empty)_ |

### Recommended Configuration for Most Subreddits

- Leave **alert-only mode ON** to start. Get comfortable with the alerts before enabling auto-bans.
- Set **bot threshold to 1** — bots are easy to verify, no reason to wait for more reports.
- Set **harassment threshold higher** (4-5) — harassment requires more context and human judgment.
- Add a few large, well-moderated subreddits to your **trusted list** (e.g., `AskReddit, worldnews, technology`).

---

## ⭐ The Trust System Explained

The trust system lets you weight certain subreddits' bans more heavily.

**How the score is calculated:**

```
Network Score = (Regular Reports) + (Trusted Reports × 2)
```

**Example scenario:**

- r/gaming (not trusted by you) bans u/spamuser → reportCount = 1, score = 1
- r/technology (trusted by you) bans u/spamuser → trustedReportCount = 1, score = 1 + (1×2) = **3**
- Your auto-ban threshold for spam is 3 → **auto-ban triggers**

Without the trust system, you'd need 3 separate subreddits to flag this user. With a trusted subreddit in the mix, it triggers after just 2.

**Who should you trust?**
- Large subreddits with active mod teams (they're less likely to abuse bans)
- Subreddits in the same topic area as yours (they face similar bad actors)
- Subreddits you have a relationship with as a moderator

---

## 📨 Alert Format

When a flagged user appears in your subreddit, you receive a modmail that looks like this:

```
Subject: 🤖 ModShield: u/spamaccount flagged (🤖 Bot)

## ModShield Network Alert

**u/spamaccount** has been flagged by the ModShield network.

| Field | Value |
|-------|-------|
| **Category** | 🤖 Bot |
| **First flagged by** | r/technology |
| **Time since first flag** | 3 day(s) ago |
| **Subreddits flagged in** | 4 |
| **Trusted subreddit flags** | 1 |
| **Network score** | 5 |

**Activity that triggered this alert:**
https://reddit.com/r/yoursubreddit/comments/abc123

**All flagging subreddits:** r/technology, r/science, r/gaming, r/news

**⚡ Auto-ban was applied automatically.**

---
*To ban this user: [click here](https://www.reddit.com/r/yoursubreddit/about/banned)*
*ModShield v1.0 | Protecting r/yoursubreddit*
```

---

## 📁 Project Structure

```
mod-shield/
├── src/
│   ├── index.ts              # App entry point — wires all Hono routes together
│   ├── core/
│   │   ├── types.ts          # All shared TypeScript types (BanRecord, SubConfig, AlertRecord)
│   │   ├── network.ts        # All Redis read/write operations (the data layer)
│   │   ├── trust.ts          # Trust scoring logic (effectiveScore, shouldAutoBan)
│   │   ├── categories.ts     # Ban category definitions and keyword inference
│   │   ├── alerts.ts         # Modmail alert formatting and sending
│   │   └── nuke.ts           # Bulk comment removal logic (Mop feature)
│   └── routes/
│       ├── api.ts            # Public API endpoints
│       ├── menu.ts           # Context menu handler endpoints (Settings, Activity Log, etc.)
│       ├── forms.ts          # Form submission handlers (save settings, mock ban, quick unban)
│       └── triggers.ts       # Event trigger handlers (ModAction, PostSubmit, CommentSubmit)
├── devvit.json               # App manifest: menus, forms, triggers, permissions
├── package.json              # Dependencies and npm scripts
├── tsconfig.json             # TypeScript compiler config (strict mode)
├── vite.config.ts            # Vite build config
└── eslint.config.js          # Linting rules
```

### What each file does

| File | Purpose |
|------|---------|
| `src/index.ts` | Creates the Hono HTTP server and mounts all route groups |
| `src/core/types.ts` | Single source of truth for all TypeScript types. Every other file imports from here. |
| `src/core/network.ts` | The data layer. All reads and writes to Redis go through here. Includes `recordBan`, `checkUser`, `getConfig`, `saveConfig`, `appendAlert`, `getAlerts`. |
| `src/core/trust.ts` | Contains `isTrusted()`, `effectiveScore()`, and `shouldAutoBan()` — the logic for the trust and auto-ban system. |
| `src/core/categories.ts` | Contains `inferCategory()` which parses ban notes/reasons to determine the category (spam/bot/scam/harassment), plus display labels and emojis. |
| `src/core/alerts.ts` | Contains `sendModmailAlert()` which formats and sends the rich modmail notification. |
| `src/core/nuke.ts` | The Mop feature: bulk removal/locking of comments and threads. |
| `src/routes/triggers.ts` | Handles `onModAction` (ban recording), `onPostSubmit`, `onCommentSubmit` (flagged user detection), and `onAppInstall`. |
| `src/routes/menu.ts` | Handles all mod menu interactions: opening the settings form, showing the activity log, quick unban, and mock network ban. |
| `src/routes/forms.ts` | Handles form submissions: saving config, processing unbans, recording mock bans. |

---

## 🏗️ Architecture Deep-Dive

### The Network Effect

ModShield's power comes from its **shared Redis database**. Devvit Redis is scoped per-app across all installs, which means every subreddit running ModShield is reading from and writing to the same ban records. This is the mechanism that creates the "network."

### Redis Key Schema

| Key Pattern | Value Type | What it stores |
|-------------|-----------|----------------|
| `flagged:{username}` | JSON `BanRecord` | The full ban record for a flagged user (global across all subs) |
| `config:modshield` | JSON `SubConfig` | This subreddit's settings (per-installation) |
| `log:alerts:{subredditName}` | JSON `AlertRecord[]` | Last 50 alerts for this subreddit (per-installation) |

### Event Flow

```
Moderator bans user
        │
        ▼
ModAction trigger fires
        │
        ▼
inferCategory(banNote) → 'spam' | 'bot' | 'scam' | 'harassment'
        │
        ▼
recordBan() → writes/updates flagged:{username} in Redis
        │
        └─────────────────────────────────────────────────────┐
                                                              │
User posts or comments in any participating sub              │
        │                                                     │
        ▼                                                     │
PostSubmit / CommentSubmit trigger fires                      │
        │                                                     │
        ▼                                                     │
checkUser(username) → reads flagged:{username} from Redis ◄──┘
        │
        ├── Not found → skip (user is clean)
        │
        └── Found → calculate effectiveScore()
                    │
                    ├── shouldAutoBan()? → reddit.banUser()
                    │
                    └── sendModmailAlert() + appendAlert()
```

### Ban Category Inference

ModShield automatically categorizes bans by scanning the moderator's ban note for keywords:

| Category | Keywords detected |
|----------|------------------|
| 🤖 Bot | `bot`, `automated` |
| 💸 Scam | `scam`, `fraud`, `phish` |
| 🚨 Harassment | `harass`, `threat`, `abuse` |
| 🗑️ Spam | _(default, everything else)_ |

If no keywords match, the ban defaults to `spam`.

### Trust Score Math

```
effectiveScore = (reportCount - trustedReportCount) + (trustedReportCount × 2)
               = reportCount + trustedReportCount
```

A user with 3 regular flags and 2 trusted flags has an effective score of **5** (3 + 2 = 5).

---

## 💻 Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start Devvit playtest (live dev on your test subreddit) |
| `npm run build` | Compile TypeScript and build the production bundle |
| `npm run type-check` | Run TypeScript type checking (no emit) |
| `npm run lint` | Run ESLint on all TypeScript source files |
| `npm run prettier` | Auto-format all files with Prettier |
| `npm run deploy` | Type-check + lint + upload a new version to Reddit |
| `npm run launch` | Deploy + submit for Reddit's public app review |
| `npm run login` | Authenticate your CLI with your Reddit account |

### Direct CLI commands (via `npx`)

| Command | What it does |
|---------|-------------|
| `npx devvit upload` | Build and upload a new version |
| `npx devvit install r/modshield_bot` | Install the uploaded version to the subreddit |
| `npx devvit playtest r/modshield_bot` | Start live playtest with streamed logs |
| `npx devvit login` | Authenticate with your Reddit account |

---

## 🔒 Privacy

ModShield is designed to be privacy-respecting:

- **Only usernames are stored** — no post content, no comment text, no personal information
- **Ban reasons are stored only as categories** (spam/bot/scam/harassment), not the raw note text
- **All data lives inside Reddit's own infrastructure** via Devvit Redis — nothing leaves Reddit's servers
- **No analytics, no tracking, no external transmission** of any kind
- User data can only be accessed by subreddit moderators through the built-in activity log

---

## 🤝 Contributing

Contributions are welcome. Here's how to get involved:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run the checks: `npm run type-check && npm run lint`
5. Commit your changes: `git commit -m "feat: add your feature"`
6. Push and open a Pull Request

### Ideas for contributions

- [ ] Add more ban categories (e.g., vote manipulation, doxxing)
- [ ] Let mods manually clear a user from the network
- [ ] Cross-sub moderator reputation system
- [ ] Subreddit-level ban export/import
- [ ] Dashboard UI using Devvit's custom post type

---

## 📄 License

BSD 3-Clause License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- Inspired by **BotDefense** (RIP July 2023) — the tool that showed the Reddit community how powerful cross-subreddit collaboration can be
- Built on [Devvit](https://developers.reddit.com/) — Reddit's developer platform that made zero-infrastructure Reddit apps possible
- Uses [Hono](https://hono.dev/) for lightweight routing and [Vite](https://vite.dev/) for fast builds

---

*ModShield — Because banning someone in one subreddit shouldn't mean every other community has to learn the hard way.*
