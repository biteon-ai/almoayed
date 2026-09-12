/**
 * TEACH-016 — Conservative LaTeX → plain Unicode math for quick-paste fields.
 * No typesetting engine; unrecognized fragments are left as-is.
 */

export type PlainMathNormalizeResult = {
  text: string;
  convertedCount: number;
  residualLatex: boolean;
};

export type QuickPasteMathNotice = {
  convertedCount: number;
  residualLatex: boolean;
  hadLatexInput: boolean;
};

export const EMPTY_MATH_NOTICE: QuickPasteMathNotice = {
  convertedCount: 0,
  residualLatex: false,
  hadLatexInput: false,
};

/** True if text looks like it contains LaTeX delimiters or commands. */
export function looksLikeLatex(text: string): boolean {
  return /\$|\\\(|\\\)|\\[a-zA-Z]+/.test(text);
}

/** True if LaTeX-like markup still remains after normalization. */
export function detectLatexResidue(text: string): boolean {
  if (/\$|\\\(|\\\)/.test(text)) return true;
  if (/\\[a-zA-Z]+/.test(text)) return true;
  return false;
}

function convertInnerCommands(input: string): {
  text: string;
  count: number;
} {
  let text = input;
  let count = 0;

  const bump = (replacement: string) => {
    count += 1;
    return replacement;
  };

  // Nested-friendly: repeat frac until stable (simple braced args only)
  for (let i = 0; i < 8; i++) {
    const next = text.replace(
      /\\frac\{([^{}]*)\}\{([^{}]*)\}/g,
      (_m, a: string, b: string) => bump(`${a}/${b}`)
    );
    if (next === text) break;
    text = next;
  }

  text = text.replace(/\\sqrt\{([^{}]*)\}/g, (_m, x: string) => bump(`√${x}`));
  text = text.replace(/\\sqrt([0-9]+)/g, (_m, x: string) => bump(`√${x}`));

  text = text.replace(
    /\\(?:overrightarrow|vec)\{([^{}]*)\}/g,
    (_m, x: string) => bump(x)
  );
  text = text.replace(
    /\\(?:widehat|hat)\{([^{}]*)\}/g,
    (_m, x: string) => bump(x)
  );

  for (const cmd of ["cos", "sin", "tan", "cot"] as const) {
    const re = new RegExp(`\\\\${cmd}(?![a-zA-Z])`, "g");
    text = text.replace(re, () => bump(cmd));
  }

  text = text.replace(/\\pm(?![a-zA-Z])/g, () => bump("±"));
  text = text.replace(/\\infty(?![a-zA-Z])/g, () => bump("∞"));
  text = text.replace(/\\cdot(?![a-zA-Z])/g, () => bump("·"));
  text = text.replace(/\\times(?![a-zA-Z])/g, () => bump("×"));

  text = text.replace(/\\\{/g, () => bump("{"));
  text = text.replace(/\\\}/g, () => bump("}"));

  return { text, count };
}

/**
 * Convert common inline LaTeX to plain Unicode/Latin math.
 * Idempotent on already-plain text.
 */
export function normalizeLatexToPlainMath(
  input: string
): PlainMathNormalizeResult {
  if (!input) {
    return { text: "", convertedCount: 0, residualLatex: false };
  }

  let text = input;
  let convertedCount = 0;

  const applyDelimited = (
    source: string,
    pattern: RegExp
  ): string =>
    source.replace(pattern, (_m, inner: string) => {
      const innerResult = convertInnerCommands(inner);
      convertedCount += innerResult.count + 1; // delimiter strip counts as conversion
      return innerResult.text;
    });

  // Block then inline dollar, then \(...\)
  text = applyDelimited(text, /\$\$([\s\S]*?)\$\$/g);
  text = applyDelimited(text, /\$([^$\n]+?)\$/g);
  text = applyDelimited(text, /\\\(([\s\S]*?)\\\)/g);

  const bare = convertInnerCommands(text);
  text = bare.text;
  convertedCount += bare.count;

  return {
    text,
    convertedCount,
    residualLatex: detectLatexResidue(text),
  };
}

/**
 * Insert a single space when an Arabic *letter* abuts Latin/digit/math symbols.
 * Does not strip existing spaces, reorder punctuation, or space before `؟` / `،`.
 */
export function ensureArabicMathSpacing(text: string): string {
  if (!text) return text;
  // Main Arabic letters (exclude punctuation like ؟ U+061F, ، U+060C)
  const arLetter = "\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06D3";
  let out = text.replace(
    new RegExp(`([${arLetter}])([A-Za-z0-9√∞±])`, "g"),
    "$1 $2"
  );
  out = out.replace(
    new RegExp(`([A-Za-z0-9√∞±])([${arLetter}])`, "g"),
    "$1 $2"
  );
  return out;
}

/** Normalize LaTeX then apply Arabic–math spacing. */
export function normalizeFieldMath(input: string): PlainMathNormalizeResult {
  const latex = normalizeLatexToPlainMath(input);
  const spaced = ensureArabicMathSpacing(latex.text);
  return {
    text: spaced,
    convertedCount: latex.convertedCount,
    residualLatex: detectLatexResidue(spaced),
  };
}

export function mergeMathNotices(
  a: QuickPasteMathNotice,
  b: QuickPasteMathNotice
): QuickPasteMathNotice {
  return {
    convertedCount: a.convertedCount + b.convertedCount,
    residualLatex: a.residualLatex || b.residualLatex,
    hadLatexInput: a.hadLatexInput || b.hadLatexInput,
  };
}
