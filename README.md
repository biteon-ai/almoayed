# المؤيد (Al-Moayed)

منصة رياضيات البكالوريا السورية — **حل بيدك ما حدا بفيدك**

## Spec Kit

Feature registry and agent prompts: **[`.speckit/spec.yaml`](.speckit/spec.yaml)** · [AGENTS.md](AGENTS.md)

Implemented: `AUTH-*` `MT-*` `QUIZ-*` `TIER-*` `TEACH-*` `UI-*` — see spec for full list.

## Stack

Next.js 14 · Tailwind CSS · Shadcn/UI · Supabase · iron-session

## Setup

```bash
npm install
cp .env.example .env   # add Supabase keys
npx supabase db push
npm run dev
```

Demo student login: `963987654321`
