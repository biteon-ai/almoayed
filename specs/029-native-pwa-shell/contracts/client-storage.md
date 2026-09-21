# Contracts: Client storage & pure helpers

No Server Actions are added. Theme, A2HS, haptics, and the offline list are device-local.

## `src/lib/appearance.ts`

```ts
export type Appearance = "light" | "dark" | "system";

export const APPEARANCE_STORAGE_KEY = "almoayed-appearance";

export function parseAppearance(raw: string | null): Appearance;
export function readAppearance(): Appearance;           // system if window missing
export function writeAppearance(value: Appearance): void;
export function resolveScheme(value: Appearance, prefersDark: boolean): "light" | "dark";
export function applyAppearanceClass(scheme: "light" | "dark"): void;
```

- `parseAppearance`: unknown → `"system"`.
- `writeAppearance` must be callable from the drawer without throwing if `localStorage` is blocked (catch + no-op).

## `src/lib/haptic.ts`

```ts
export function hapticPulse(pattern?: number | number[]): void;
```

- Default pattern `10` (ms) for answers; submit may pass `20` or `[10, 30, 10]`.
- If `typeof navigator === "undefined"` or `!navigator.vibrate`, return.
- Wrap `navigator.vibrate(pattern)` in try/catch.
- Must be synchronous aside from the native call — callers update React state **first or in the same tick**, never after an artificial timeout.

## `src/lib/a2hs-prompt.ts`

```ts
export const A2HS_DISMISS_KEY = "almoayed-a2hs-dismissed-at";
export const A2HS_SNOOZE_MS = 24 * 60 * 60 * 1000;

export function shouldShowA2hsSheet(input: {
  standalone: boolean;
  isStudent: boolean;
  pathname: string;
  isPhoneViewport: boolean;
  sessionHidden: boolean;
  dismissedAt: string | null;
  now?: number;
}): boolean;

export function markA2hsDismissed(now?: number): void; // writes ISO timestamp
```

`shouldShowA2hsSheet` is **false** when:

- `standalone`
- `!isStudent`
- `pathname` matches `^/quiz(/|$)`
- `!isPhoneViewport`
- `sessionHidden`
- `dismissedAt` parses to a time within `A2HS_SNOOZE_MS`

## `listQuizPackages` (`src/lib/offline/quiz-cache.ts`)

```ts
export async function listQuizPackages(input: {
  teacherId: string | null;
}): Promise<QuizPackageRecord[]>;
```

- `idbGetAll(quizPackages)`.
- If `teacherId` is null, return `[]`.
- Filter `record.teacherId === teacherId`.
- Sort `openedAt` descending.
- Do **not** strip questions here (caller only displays title/meta). UI must not render question bodies in the drawer.

Existing `saveQuizPackage` / `getQuizPackage` / LRU / `assertGatekeeperCompliance` **unchanged**.

## Share / contact helpers (`src/lib/constants.ts` or `src/lib/native-share.ts`)

```ts
export function buildAppSharePayload(origin?: string): {
  title: string;
  text: string;
  url: string;
};

export function buildSupportWhatsAppUrl(): string;
```

- Share URL production default `https://almoayed.app`.
- Support WhatsApp uses existing `TEACHER_WHATSAPP` + Arabic «مرحباً، أحتاج مساعدة في تطبيق المؤيد».
- Mailto fallback `EMAIL_SUPPORT_EMAIL`.
