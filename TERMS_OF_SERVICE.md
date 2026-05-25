# Terms of Service

**ModShield — Cross-Subreddit Ban Intelligence**

*Last updated: May 25, 2025*

---

## 1. Acceptance of Terms

By installing, enabling, or using ModShield ("the App") on any subreddit you moderate, you agree to these Terms of Service ("Terms"). If you do not agree, do not install or use the App.

ModShield is a Reddit Devvit application. Your use of the App is also subject to [Reddit's Developer Terms](https://www.redditinc.com/policies/developer-terms) and [Reddit's User Agreement](https://www.redditinc.com/policies/user-agreement).

---

## 2. Description of Service

ModShield is a free, open-source moderation tool that creates a shared ban intelligence network across participating subreddits. The App:

- Records ban actions taken by moderators within participating subreddits
- Alerts other participating subreddits when a previously flagged user posts or comments
- Optionally auto-bans users who exceed configurable trust-scored thresholds
- Provides bulk comment management tools ("Mop")

---

## 3. Eligibility

To use ModShield, you must:

- Have an active Reddit account in good standing
- Be a moderator of the subreddit(s) where the App is installed
- Comply with Reddit's Content Policy and Moderator Code of Conduct

---

## 4. Data Collection and Storage

### 4.1 What We Store

ModShield stores the following data within Reddit's own infrastructure (Devvit Redis):

- **Usernames** of users who have been banned by participating subreddits
- **Ban categories** (spam, bot, scam, or harassment) — inferred from moderator ban notes via keyword matching
- **Subreddit names** that issued each ban
- **Moderator usernames** who performed ban actions
- **Timestamps** of ban events
- **Per-subreddit configuration** settings chosen by moderators
- **Alert history** (last 50 alerts per subreddit)

### 4.2 What We Do NOT Store

- Post or comment content
- Raw moderator ban notes or reasons
- Personal information beyond Reddit usernames
- IP addresses or device information
- Any data outside Reddit's infrastructure

### 4.3 Where Data Lives

All data is stored exclusively within Reddit's Devvit Redis infrastructure. No data is transmitted to, processed by, or stored on any external server, third-party service, or private infrastructure.

### 4.4 Data Retention

Ban records persist in the shared network database for as long as the App is operational. There is currently no automatic expiration of ban records. Moderators may request removal of specific records by contacting the maintainer.

---

## 5. How the Network Works

### 5.1 Shared Intelligence

When ModShield is installed on a subreddit, that subreddit becomes a participant in a shared ban intelligence network. Ban actions taken in your subreddit are visible to all other participating subreddits, and vice versa.

### 5.2 Moderator Responsibility

By using ModShield, you acknowledge that:

- Bans you issue will be recorded and shared across the network
- Other subreddits may take automated action based on bans your subreddit records
- You are responsible for ensuring bans issued in your subreddit are legitimate and comply with Reddit's policies
- Abuse of the ban system (e.g., banning users in bad faith to trigger network-wide consequences) is a violation of these Terms

### 5.3 Trust System

Subreddits may designate other subreddits as "trusted," which gives those subreddits' bans additional weight in scoring. Trust designations are made independently by each subreddit and do not imply endorsement or partnership.

---

## 6. Auto-Ban Feature

### 6.1 Opt-In Only

Auto-ban is disabled by default. Moderators must explicitly enable it and configure per-category thresholds.

### 6.2 Moderator Accountability

If you enable auto-ban, you accept full responsibility for automated ban actions taken in your subreddit. ModShield provides the mechanism; the moderator chooses to enable and configure it.

---

## 7. Acceptable Use

You agree NOT to:

- Use ModShield to target, harass, or discriminate against specific users or groups
- Issue fraudulent or bad-faith bans to manipulate the network
- Attempt to exploit, reverse-engineer, or interfere with the shared ban database
- Use the App in violation of Reddit's Content Policy, Moderator Code of Conduct, or Developer Terms
- Misrepresent ModShield's alerts or data to justify unwarranted moderation actions

---

## 8. Disclaimer of Warranties

ModShield is provided **"AS IS"** and **"AS AVAILABLE"** without warranties of any kind, express or implied, including but not limited to:

- Fitness for a particular purpose
- Accuracy or completeness of ban data
- Uninterrupted or error-free operation
- Compatibility with future versions of Reddit or Devvit

The App relies on Reddit's Devvit platform. Any changes, outages, or deprecations on Reddit's side may affect the App's functionality without prior notice.

---

## 9. Limitation of Liability

To the maximum extent permitted by applicable law, the authors and contributors of ModShield shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from:

- Use or inability to use the App
- Incorrect, delayed, or missing ban alerts
- Erroneous auto-ban actions
- Data loss or corruption within the shared network
- Actions taken by other subreddits based on shared ban data

---

## 10. Indemnification

You agree to indemnify and hold harmless the authors and contributors of ModShield from any claims, damages, losses, or expenses (including legal fees) arising from your use of the App or your violation of these Terms.

---

## 11. Open-Source License

ModShield is open-source software licensed under the **BSD 3-Clause License**. These Terms of Service govern your use of the hosted App on Reddit. For the source code license, see [LICENSE](LICENSE).

---

## 12. Modifications to the Service

We reserve the right to modify, suspend, or discontinue ModShield at any time, with or without notice. We are not liable for any modification, suspension, or discontinuation of the App.

---

## 13. Changes to These Terms

We may update these Terms from time to time. Changes will be reflected by updating the "Last updated" date at the top of this document. Continued use of the App after changes constitutes acceptance of the revised Terms.

---

## 14. Termination

We reserve the right to revoke access to ModShield for any subreddit or moderator that violates these Terms or engages in abuse of the shared network.

---

## 15. Governing Law

These Terms are governed by and construed in accordance with applicable law, without regard to conflict-of-law principles. Any disputes shall be resolved through good-faith communication before pursuing formal remedies.

---

## 16. Contact

For questions about these Terms, please:

- Open an issue on the [GitHub repository](https://github.com/MohdAltamish/mod-shield)
- Send a message via Reddit to the maintainer

---

*ModShield is a community-built, open-source project. It is not affiliated with, endorsed by, or officially supported by Reddit Inc.*
