# Contributing to ModShield

Thank you for your interest in contributing to ModShield! This guide will help you get started.

## 🚀 Quick Start

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/mod-shield.git
   cd mod-shield
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Login** to Devvit:
   ```bash
   npx devvit login
   ```
5. **Start** development:
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names:
- `feat/add-vote-manipulation-category` — new features
- `fix/alert-formatting-bug` — bug fixes
- `docs/update-trust-system-docs` — documentation
- `refactor/extract-config-validation` — code improvements

### Code Quality

Before submitting a pull request, ensure your code passes all checks:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Formatting
npm run prettier
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat: add vote manipulation ban category`
- `fix: correct trust score calculation for edge case`
- `docs: improve configuration guide`
- `refactor: extract shared validation logic`
- `chore: update devvit dependency`

## 🏗️ Architecture Overview

ModShield follows a clean layered architecture:

```
src/
├── core/        # Business logic (no HTTP awareness)
│   ├── types.ts       # Shared TypeScript types
│   ├── network.ts     # Redis data operations
│   ├── trust.ts       # Trust scoring logic
│   ├── categories.ts  # Ban category inference
│   ├── alerts.ts      # Modmail formatting
│   └── nuke.ts        # Bulk comment management
└── routes/      # HTTP layer (Hono handlers)
    ├── api.ts         # Public API routes
    ├── menu.ts        # Mod menu handlers
    ├── forms.ts       # Form submission handlers
    └── triggers.ts    # Event trigger handlers
```

### Key Principles

1. **Core modules have no HTTP awareness** — they receive data and return results
2. **Routes are thin** — they parse requests, call core functions, and format responses
3. **All types live in `types.ts`** — single source of truth
4. **Redis operations are centralized in `network.ts`** — no scattered data access

## 🧪 Testing Locally

1. Configure your development subreddit in `devvit.json`:
   ```json
   "dev": {
     "subreddit": "your_test_subreddit"
   }
   ```

2. Start the Devvit playtest:
   ```bash
   npx devvit playtest r/your_test_subreddit
   ```

3. Use the **Mock Network Ban** tool from the subreddit menu to create test data without affecting real users.

## 💡 Ideas for Contributions

- [ ] Add more ban categories (e.g., vote manipulation, doxxing)
- [ ] Let mods manually clear a user from the network
- [ ] Cross-sub moderator reputation system
- [ ] Subreddit-level ban export/import
- [ ] Dashboard UI using Devvit's custom post type
- [ ] Rate limiting for alert notifications
- [ ] Webhook integration for external alerting

## 📄 License

By contributing, you agree that your contributions will be licensed under the BSD 3-Clause License.
