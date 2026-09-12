# UI Components Contract: TEACH-016

## Surface: `QuickTextPasteDialog`

**Route context**: `/teacher/quizzes/[id]` — existing «لصق نصي سريع» entry (unchanged open/close).

### Math notice banner (NEW)

| Property | Contract |
|----------|----------|
| Visibility | Show when `parseQuickPasteDocument(text).mathNotice.hadLatexInput` or `mathNotice.residualLatex` |
| Language | Arabic only |
| Tone | Non-blocking informational (does not block Save) |
| Suggested copy (residual) | e.g. «تم تبسيط الرموز الرياضية الشائعة. أي أوامر LaTeX متبقية ستظهر كنص عادي.» |
| Suggested copy (fully converted) | Optional shorter note: «تم تحويل الرموز الرياضية إلى نص مقروء.» |
| Placement | Near preview header / above draft list; must not replace settings card or validity badge |
| Touch | If dismissible, target ≥ `h-10`; dismissal is session-local only (reappears if paste still has residue) |

### Samples / copy buttons (EXISTING)

| Control | Change |
|---------|--------|
| «نسخ نموذج LMS» | Copies updated Unicode `LMS_QUICK_PASTE_SAMPLE` |
| «نسخ نموذج عربي» | Unchanged unless STEM lines added (still LaTeX-free) |

### Preview list (EXISTING)

| Behavior | Contract |
|----------|----------|
| Stem / options display | Show **normalized** draft strings from `parseQuickPasteDocument` |
| Validity | Unchanged TEACH-013/014 rules; residual LaTeX alone never marks invalid |
| Format badge | Unchanged (`LMS` / `عربي`) |

### Save / Cancel

Unchanged. Save still posts raw textarea to `importQuickPasteQuestions`; server re-normalizes.

---

## Spekit (optional)

| Key | Placement |
|-----|-----------|
| `quick-text-paste-math-notice` | Root of math notice banner |

Register in `src/lib/spekit-targets.ts` + `.speckit/spekit-targets.yaml` if the banner ships.

---

## Out of scope UI

- Student quiz player math renderer
- Teacher question edit rich-text math toolbar
- Bulk “convert existing questions” admin tool
