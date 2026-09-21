import type { AttemptPresentation } from "@/types/database";

/** Half-open [0, 1). */
export type Rng = () => number;

export type ShufflableQuestion = {
  id: string;
  options: string[];
};

function sequencesEqual<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function createCryptoRng(): Rng {
  return () => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 2 ** 32;
  };
}

export function fisherYates<T>(items: T[], rng: Rng): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const current = next[i];
    const swap = next[j];
    if (current === undefined || swap === undefined) continue;
    next[i] = swap;
    next[j] = current;
  }
  return next;
}

export function shuffleDistinctFrom<T>(
  items: T[],
  previous: T[] | null,
  rng: Rng
): T[] {
  if (items.length < 2) return [...items];

  let next = fisherYates(items, rng);
  let guard = 0;
  while (
    previous &&
    previous.length === items.length &&
    sequencesEqual(next, previous) &&
    guard < 20
  ) {
    next = fisherYates(items, rng);
    guard += 1;
  }

  if (
    previous &&
    previous.length === items.length &&
    sequencesEqual(next, previous)
  ) {
    next = [...next];
    const first = next[0];
    const second = next[1];
    if (first !== undefined && second !== undefined) {
      next[0] = second;
      next[1] = first;
    }
  }

  return next;
}

export function buildAttemptPresentation(args: {
  questions: ShufflableQuestion[];
  previous: AttemptPresentation | null;
  rng: Rng;
}): AttemptPresentation {
  const ids = args.questions.map((question) => question.id);
  const questionIds = shuffleDistinctFrom(
    ids,
    args.previous?.questionIds ?? null,
    args.rng
  );

  const optionOrders: Record<string, string[]> = {};
  for (const question of args.questions) {
    optionOrders[question.id] = shuffleDistinctFrom(
      question.options,
      args.previous?.optionOrders[question.id] ?? null,
      args.rng
    );
  }

  return { questionIds, optionOrders };
}
