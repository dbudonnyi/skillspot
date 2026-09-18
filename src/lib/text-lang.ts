/**
 * Client-side heuristic: does this text already look like it's written in `loc`?
 * Used to hide the "See translation" button when there is nothing to translate.
 * Intentionally conservative — only hides in obvious cases.
 */
export function textLooksNative(text: string, loc: "en" | "pl" | "uk"): boolean {
  const hasCyr = /[\u0400-\u04FF]/.test(text);
  const hasPlMarks = /[żźęłąńćś]/i.test(text);
  if (loc === "uk") return hasCyr;
  if (loc === "pl") return !hasCyr && hasPlMarks;
  return !hasCyr && !hasPlMarks;
}
