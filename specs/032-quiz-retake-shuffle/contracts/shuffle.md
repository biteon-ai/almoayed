# Contracts: Shuffle helpers (QUIZ-006)

Pure functions in `src/lib/quiz-shuffle.ts`. No I/O. Vitest `[QUIZ-006]`.

## Types

```ts
type Rng = () => number; // half-open [0, 1)

type AttemptPresentation = {
  questionIds: string[];
  optionOrders: Record<string, string[]>;
};

type ShufflableQuestion = {
  id: string;
  options: string[];
};
```

MUST NOT accept or return `correct_answer`, explanations, or category tags.

## `fisherYates<T>(items: T[], rng: Rng): T[]`

- Returns a **new** array; does not mutate `items`.
- Every index is a permutation of the input (same multiset).
- `items.length < 2` → shallow copy.

## `shuffleDistinctFrom<T>(items: T[], previous: T[] | null, rng: Rng): T[]`

- If `items.length < 2` or `previous` is null/length mismatch: same as `fisherYates`.
- Result MUST NOT equal `previous` when `items.length >= 2`.
- Implementation: shuffle, bounded retries, then swap indices `0` and `1` if still equal.

## `buildAttemptPresentation(args): AttemptPresentation`

```ts
{
  questions: ShufflableQuestion[];
  previous: AttemptPresentation | null;
  rng: Rng;
}
```

Rules:
- `questionIds` is `shuffleDistinctFrom` of current IDs vs `previous?.questionIds`.
- For each question, `optionOrders[id] = shuffleDistinctFrom(options, previous?.optionOrders[id] ?? null, rng)` using that question’s **current** option texts.
- Every current question id appears exactly once.
- Unknown ids in `previous` are ignored.

## `isPermutation(actual: string[], expected: string[]): boolean`

Same length and same multiset (order-insensitive). Used to validate stored snapshots against the live bank.

## `applyPresentation(questions: ExamQuestion[], presentation: AttemptPresentation): ExamQuestion[]`

- Output order follows `presentation.questionIds`.
- Each item’s `options` replaced with `presentation.optionOrders[id]` when that array is a permutation of authored options; otherwise keep authored options (should not happen if minting validated).
- IDs in presentation missing from `questions` are skipped; leftover live questions append in authored `sort_order` only if minting is being repaired — **taking path must not append** (FR-010: mint must already be a complete permutation). Prefer throwing in tests if incomplete.

## `presentationsEqual(a, b): boolean`

Question id sequences equal **and** every shared question’s option arrays equal.

## Production RNG

`createCryptoRng(): Rng` wrapping `crypto.getRandomValues`. Not unit-tested for statistical quality; helpers take `rng` so tests stay deterministic.
