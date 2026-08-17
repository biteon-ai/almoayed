# UI Component Contracts: TEACH-014

## Entry

Same as TEACH-013: «لصق نصي سريع» → `QuickTextPasteDialog`.

## Dialog extensions

| Element | Requirement |
|---------|-------------|
| Settings preview | When header detected: RTL card listing Quiz Type / Attempts / Timer / Duration with Arabic labels |
| Field warnings | Invalid/skipped fields show Arabic warning chip/text on the card |
| Question preview | Existing valid/invalid list; optional badge `LMS` / `عربي` per draft |
| Copy LMS sample | Secondary control «نسخ نموذج LMS» (or equivalent) pasting English template sample |
| Save | Same confirm; toast includes imported count + settings applied/skipped summary when relevant |
| Spekit (optional) | `quick-text-paste-settings` on settings preview root |

## UX rules (clarifications)

- Preview settings before save; apply on same confirm as questions  
- No separate settings-only confirm  
- Close dialog when `imported ≥ 1`  
- Zero valid questions → keep open; no settings write  

## Out of scope UI

- In-app AI generation  
- Per-row edit in preview  
- Format toggle (auto-detect instead)  
