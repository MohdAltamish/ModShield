# ModShield: Competitive Analysis & Research Report

A comparative research report analyzing **ModShield (Federated Ban Intelligence Network)** against popular pre-existing and active Reddit moderation tools.

---

## Executive Summary

Reddit moderation has historically operated in siloes. While individual subreddits manage their own communities, bad actors—such as coordinated spammers, malicious scammers, ban evaders, and brigaders—frequently hop from one community to another. 

To combat this, subreddits have traditionally relied on custom Python (PRAW) bots, browser extensions, or central blocklists. However, recent API changes, policy updates (such as Reddit's March 2026 restriction on participation-based mass bans), and the deprecation of legacy tools have created a critical void.

**ModShield** solves this by establishing a **Federated Ban Intelligence Network** directly on the native Reddit Developer Platform (Devvit). Rather than maintaining a rigid, centralized blocklist or profiling user subscriptions, ModShield enables participating subreddits to securely share actual moderator-issued ban events in real time. Through customizable trust tiers and category-based action thresholds, communities can collaborate to defend themselves while maintaining absolute autonomy.

---

## The Reddit Moderation Tool Landscape

Here is an analysis of the major tools currently used by Reddit moderators, including legacy and Devvit-based solutions:

### 1. AutoModerator (Native)
*   **How it works:** A built-in, YAML-configured bot that executes rules on posts and comments as they are submitted.
*   **Limitations:** AutoModerator is entirely stateless and restricted to the single subreddit where it is configured. It cannot lookup historical patterns across Reddit, track bans in other communities, or dynamically share data with other moderator teams.

### 2. Reddit Moderator Toolbox (Toolbox)
*   **How it works:** A legacy browser extension that adds UI overlays, macro buttons, and local notes.
*   **Limitations:** Toolbox is a client-side tool. Notes (usernotes) are stored in individual subreddit wikis (`/wiki/usernotes`) and are completely siloed. Furthermore, Toolbox is no longer actively maintained as Reddit pushes mods toward its native features.

### 3. BotDefense & Bot Bouncer
*   **BotDefense (Defunct):** A central PRAW bot that auto-banned known spambots across Reddit. It shut down in 2023 due to API changes, leaving a massive gap.
*   **Bot Bouncer (Active Devvit App):** The modern Devvit replacement for BotDefense. It queries a central database maintained by its developers to auto-ban known spambots.
*   **ModShield Difference:** While Bot Bouncer focuses strictly on known spambots using a centralized blacklist, ModShield is a general-purpose threat intelligence network. It handles scammers, brigaders, and harassment, and lets subreddits choose *whom* they trust (federation) rather than relying on a single central authority.

### 4. Saferbot / Safestbot (Legacy PRAW Bots)
*   **How it works:** Custom PRAW-based bots that monitored specific "harassment/brigading" subreddits and preemptively banned anyone participating in them.
*   **Limitations:** As of **March 19, 2026**, Reddit officially prohibited third-party bots from performing automated mass bans based solely on a user's participation in other subreddits. Saferbot had to strip its auto-ban features. They are also notoriously complex to host and configure.
*   **ModShield Difference:** ModShield is 100% compliant with Reddit's policies because it operates on **active moderator ban actions** (for scamming, spamming, harassment) from trusted communities rather than scraped subreddit participation.

### 5. Reddit Native Ban Evasion Filter
*   **How it works:** Reddit's internal machine-learning filter that links new accounts to previously banned accounts using signals like IP addresses, browser fingerprints, and device IDs.
*   **Limitations:** It only prevents a user from evading a ban *within the same subreddit*. If a scammer is banned in Subreddit A, the Ban Evasion Filter does nothing to stop them from scamming users in Subreddit B.

---

## Detailed Comparison Table

| Feature / Dimension | **ModShield (Our App)** | **AutoModerator** | **Reddit Toolbox** | **Bot Bouncer (Devvit)** | **PRAW Bots (Saferbot)** | **Reddit Native Filters** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Platform Integration** | Native Devvit App (Serverless) | Native YAML Config | Browser Extension (Client-side) | Native Devvit App (Serverless) | External Server (Requires Hosting) | Native Core Feature |
| **Data Sharing Model** | **Federated Trust Network** (P2P-style shared DB) | None (Siloed) | Wiki Pages (Siloed) | Centralized Blacklist | Monitored Subreddits | Internal Admin Signals Only |
| **Real-time Detection** | **Yes** (Runs on post/comment triggers) | Yes (On submission) | No (Client-side trigger) | Yes (On submission) | Delayed (Depends on script loop) | Yes (On submission) |
| **Action Customization** | Auto-ban, Modmail Alert, or Activity Log | Filter, Remove, Report, Spam | Manual UI Actions Only | Auto-ban Only | Comment Removal / Flagging (Post-2026) | Filter to Modqueue |
| **Trust Tiers** | **Yes** (Weighted actions based on trust score) | No | No | No | No | No (Only confidence levels) |
| **Policy Compliance (2026)** | **100% Compliant** (Uses mod actions) | Compliant | Compliant | Compliant | Restricted (Mass bans banned) | Compliant |
| **Setup Complexity** | **Zero-Install** (Click to add via App Directory) | Moderate (YAML syntax knowledge) | High (Requires browser extension) | Zero-Install | Very High (PRAW API keys, servers) | Simple Toggle |
| **Cross-Subreddit Protection** | **Yes** (Shared network bans) | No | No | Yes (Spambots only) | Yes (Legacy, now neutered) | No (Subreddit-specific only) |
| **Mod Transparency** | **High** (Dynamic Activity Log & Modmail Tables) | Medium (Modlog entries) | High (Usernotes overlay) | Low (Silent actions) | Medium (Bot log comments) | Low (Opaque signals, no proof) |

---

## Why ModShield Wins the Hackathon (Unique Positioning)

> [!TIP]
> **Highlighting ModShield's strategic advantages makes for a winning hackathon pitch.**

1. **Addresses a Major Pain Point Left by BotDefense:** Since BotDefense went offline, moderators have been desperate for a collaborative defense mechanism. ModShield fills this void using Devvit's native, modern toolkit.
2. **Federation over Dictatorship:** Unlike other tools that enforce a single, global ban list, ModShield respects subreddit sovereignty. Subreddit A can decide to trust Subreddit B (Tier 1) but ignore flags from Subreddit C (Tier 3).
3. **Multi-Category intelligence:** Spammers, Scammers, Brigaders, and Harassers require different actions. ModShield categorizes threats, allowing moderators to auto-ban scammers while only receiving modmail warnings for potential brigaders.
4. **Complete Reddit Policy Compliance:** By basing intelligence on official moderator-issued bans instead of crawling user profile subscriptions, ModShield complies fully with the March 2026 Reddit policy updates.
5. **No Technical Overhead:** Historically, cross-subreddit protection required hosting python scripts on Heroku/AWS. ModShield runs serverlessly on Reddit's infrastructure with a visual settings form.
