# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.9   | ✅ Yes             |
| < 0.0.9 | ❌ No              |

## Reporting a Vulnerability

If you discover a security vulnerability in ModShield, please report it responsibly.

### How to Report

1. **Do NOT open a public GitHub issue** for security vulnerabilities
2. Send a detailed report to the repository maintainer via Reddit direct message
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Assessment**: We'll evaluate the severity and impact within 1 week
- **Fix**: Critical vulnerabilities will be patched as soon as possible
- **Disclosure**: We'll coordinate with you on public disclosure timing

## Security Design

ModShield is designed with security in mind:

### Data Privacy
- Only usernames and ban categories are stored — no post content, no comment text
- Ban reasons are stored as categories (spam/bot/scam/harassment), never raw moderator notes
- All data resides within Reddit's own infrastructure via Devvit Redis

### Access Control
- All mod tools require moderator permissions (enforced by Devvit)
- The Mop feature verifies `posts` or `all` mod permissions before executing
- No external API endpoints expose user data

### No External Dependencies
- Zero external servers or API calls
- No analytics, tracking, or external data transmission
- All processing happens within Reddit's Devvit runtime

## Scope

The following are **in scope** for security reports:
- Data leakage through Redis key patterns
- Permission bypass in mod tool handlers
- Ban evasion through the network detection system
- Denial of service through form inputs

The following are **out of scope**:
- Issues in Reddit's platform or Devvit runtime itself
- Social engineering attacks against moderators
- Issues requiring physical access to a moderator's device
