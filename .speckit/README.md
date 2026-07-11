# Spec Kit — Al-Moayed (المؤيد)

This folder is the **source of truth** for what the app does and how agents should work on it.

## Files

| File | Use |
|------|-----|
| **spec.yaml** | All implemented features (AUTH-*, QUIZ-*, TEACH-*, etc.) with routes, files, acceptance criteria |
| **constitution.md** | Non-negotiable architecture rules |
| **PROMPT.md** | Full agent system prompt — paste into Cursor or other AI tools |
| **spekit-targets.yaml** | Spekit.co DAP selectors (`data-spekit="..."`) |

## For developers

1. Open **spec.yaml** before starting a task — find the feature ID.
2. After shipping a change, update **spec.yaml** (`status`, acceptance, or new `id`).
3. Cursor loads **`.cursor/rules/almoayed-speckit.mdc`** automatically.

## For Spekit (in-app help)

Wire Spots using selectors from **spekit-targets.yaml**, e.g.:

```css
[data-spekit="quiz-gatekeeper"]
```

## Implemented count

**18 features** shipped · **4 partial** · **58 Spekit hooks**

See `spec.yaml` for the full list.
