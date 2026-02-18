# SteadyLetters iOS

AI-powered physical letter sending app built with Expo Router and React Native.

## Tech Stack

- **Framework**: Expo 52, React Native 0.76, Expo Router 4
- **Language**: TypeScript 5.3 (strict mode)
- **Backend**: Supabase (auth + database)
- **Mail API**: Thanks.io (physical letter delivery)
- **AI**: OpenAI GPT-4o (letter generation), Whisper (voice transcription)
- **Billing**: RevenueCat (in-app purchases)
- **Analytics**: PostHog
- **State**: React Context (auth/theme), Zustand

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in all EXPO_PUBLIC_* values in .env

# Start development server
npm start

# Run on iOS simulator
npm run ios
```

## Required Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_THANKS_IO_API_KEY=
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_POSTHOG_API_KEY=
EXPO_PUBLIC_POSTHOG_HOST=
EXPO_PUBLIC_APP_URL=
EXPO_PUBLIC_REVENUCAT_API_KEY=
```

## Project Structure

```
ios/
  app/
    (auth)/           # Auth screens (sign-in, sign-up, forgot-password)
    (tabs)/           # Main tabs (create, recipients, templates, orders, settings)
    _layout.tsx       # Root layout with providers
    send.tsx          # Send letter modal
    voice-recorder.tsx # Voice recording modal
    add-recipient.tsx  # Add recipient modal
  services/
    supabase.ts       # Supabase client with SecureStore
    api.ts            # CRUD operations for recipients, orders, templates, usage
    thanks-io.ts      # Thanks.io mail API client
    openai.ts         # OpenAI GPT-4o + Whisper client
  providers/
    AuthProvider.tsx   # Authentication state context
    ThemeProvider.tsx   # Theme (light/dark/system) context
  constants/
    config.ts          # Environment variables and tier definitions
    colors.ts          # Light/dark theme color palettes
    typography.ts      # Font sizes, weights, line heights
  components/          # Shared UI components
  tests/
    live/              # Live API integration tests
  scripts/
    verify-features.ts # Feature verification harness
  feature_list.json    # 156 features with pass/fail tracking
  claude-progress.txt  # Agent session progress log
```

## Feature Tracking

This project uses `feature_list.json` to track 184 specific, testable requirements across 18 categories. Each feature has a unique ID, description, target file, and pass/fail status.

```bash
# View feature summary
npm run verify

# View failing features
npm run verify:failing

# View passing features
npm run verify:passing

# Mark a feature as passing
npx ts-node scripts/verify-features.ts --set IOS-AUTH-001 true
```

### Feature Categories

| Category | Features | Description |
|----------|----------|-------------|
| auth | 18 | Authentication flow (sign-in, sign-up, password reset, session) |
| letter-generation | 18 | AI letter creation, voice recording, templates |
| send-flow | 14 | Product selection, recipient picker, Thanks.io sending |
| recipients | 9 | Address book CRUD |
| orders | 8 | Order history and status tracking |
| templates | 3 | Save/reuse letter templates |
| settings | 14 | Profile, theme, sign out, subscription |
| navigation | 8 | Tabs, modals, splash screen, providers |
| services | 27 | API clients (Supabase, Thanks.io, OpenAI) |
| billing | 8 | RevenueCat in-app purchases |
| analytics | 7 | PostHog event tracking |
| notifications | 5 | Push notifications (expo-notifications) |
| polish | 14 | Error boundaries, skeletons, haptics, empty states |
| accessibility | 4 | VoiceOver labels and screen reader support |
| security | 6 | API key handling, SecureStore, input sanitization |
| performance | 4 | FlatList, memoization, lazy loading |
| testing | 9 | Live integration test infrastructure |
| config | 8 | Configuration files and constants |

## Testing

```bash
# Run unit tests
npm test

# Run live integration tests (requires Thanks.io API key)
npm run test:live

# Run smoke test subset
npm run test:live:smoke
```

## Subscription Tiers

| Tier | Price | Letters/Month | Products |
|------|-------|---------------|----------|
| Free | $0 | 5 generations, 2 sent | Postcards |
| Pro | $29/mo | 50 generations, 20 sent | + Letters, Greeting Cards |
| Business | $99/mo | Unlimited | All products |
