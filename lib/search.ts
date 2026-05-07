/**
 * Smart food search — Mercadona-style word-prefix tokenization.
 *
 * Rules:
 *  - "pechuga"   → matches "Pechugas de pollo"   (word starts-with)
 *  - "pechuga pollo" → matches "Pechugas de pollo" (both words prefix-match)
 *  - "fajitas"   → matches "Tortillas de trigo"   (synonym dict)
 *  - Classic substring/exact still works as fallback
 *
 * Returns a rank score (0 = best).  null = no match.
 */

// ─── Accent normalization ─────────────────────────────────────────────────────
export function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// ─── Word tokenizer ───────────────────────────────────────────────────────────
function tokens(s: string): string[] {
  return norm(s).split(/[\s\-\/,]+/).filter((t) => t.length > 0);
}

// ─── Synonym dictionary ───────────────────────────────────────────────────────
// Keys are query words that should also match foods containing the value words.
const SYNONYMS: Record<string, string[]> = {
  fajita: ["tortilla", "trigo"],
  fajitas: ["tortilla", "trigo"],
  wrap: ["tortilla", "trigo"],
  wraps: ["tortilla", "trigo"],
  ketchup: ["tomate", "catsup"],
  catsup: ["tomate", "ketchup"],
  nata: ["crema"],
  crema: ["nata"],
  calabacin: ["zucchini", "zuchini"],
  zucchini: ["calabacin"],
  maiz: ["choclo", "elote"],
  choclo: ["maiz"],
  atun: ["bonito", "tuna"],
  bonito: ["atun"],
  jamon: ["paleta", "lomo"],
  panceta: ["bacon", "beicon", "tocino"],
  bacon: ["panceta", "beicon"],
  beicon: ["panceta", "bacon"],
  queso: ["burgos", "fresco"],
  yogur: ["yogurt"],
  yogurt: ["yogur"],
  leche: ["lactosa"],
  filete: ["escalopa", "pechuga", "solomillo"],
  pollo: ["pechuga", "muslo", "contramuslo", "alitas"],
};

// Expand query tokens with synonyms
function expandWithSynonyms(queryTokens: string[]): string[] {
  const extra: string[] = [];
  for (const qt of queryTokens) {
    const syns = SYNONYMS[qt];
    if (syns) extra.push(...syns);
  }
  return [...queryTokens, ...extra];
}

// ─── Core match/score function ────────────────────────────────────────────────
/**
 * Returns a rank bucket (0–4) or null if the item doesn't match.
 * Lower bucket = better match.
 *
 * Bucket 0 — exact full name match
 * Bucket 1 — name starts with query (phrase)
 * Bucket 2 — all query words are prefixes of some name word (word-prefix match)
 * Bucket 3 — name contains query as substring (legacy)
 * Bucket 4 — brand/secondary field contains query (legacy)
 */
export function scoreSearch(
  query: string,
  name: string,
  secondary?: string
): number | null {
  const q = norm(query.trim());
  if (!q) return 0; // empty query → always matches

  const n = norm(name);

  // 0 — exact
  if (n === q) return 0;

  // 1 — phrase starts-with
  if (n.startsWith(q)) return 1;

  // 2 — word-prefix: every query token prefixes at least one name token
  const qTokens = tokens(q);
  const nTokens = tokens(n);

  const allPrefixMatch = qTokens.every((qt) =>
    nTokens.some((nt) => nt.startsWith(qt))
  );
  if (allPrefixMatch) return 2;

  // 2 also — synonym expansion: expand query tokens and re-try word-prefix
  if (qTokens.length > 0) {
    const expandedTokens = expandWithSynonyms(qTokens);
    // For synonym matches, require at least one synonym token to prefix-match
    // AND the original query word must appear somewhere (loosely)
    const hasSynMatch = expandedTokens.some((et) =>
      nTokens.some((nt) => nt.startsWith(et))
    );
    if (hasSynMatch && expandedTokens.length > qTokens.length) {
      // Only grant if the synonym expansion actually added coverage
      const origCovered = qTokens.filter((qt) =>
        nTokens.some((nt) => nt.startsWith(qt))
      ).length;
      const expandedCovered = expandedTokens.filter((et) =>
        nTokens.some((nt) => nt.startsWith(et))
      ).length;
      if (expandedCovered > origCovered) return 2;
    }
  }

  // 3 — substring in name
  if (n.includes(q)) return 3;

  // 4 — substring in secondary (brand, etc.)
  if (secondary && norm(secondary).includes(q)) return 4;

  return null; // no match
}

/**
 * Filter + rank a list of items by smart search.
 *
 * @param items   Array of items to search
 * @param query   User's search string
 * @param getName Function to extract the primary search field (name)
 * @param getSecondary Optional function for secondary field (brand)
 * @param limit   Max results to return (default 60)
 */
export function smartSearch<T>(
  items: T[],
  query: string,
  getName: (item: T) => string,
  getSecondary?: (item: T) => string | null | undefined,
  limit = 60
): T[] {
  const q = query.trim();
  if (!q) return [];

  const scored: { item: T; bucket: number; name: string }[] = [];

  for (const item of items) {
    const name = getName(item);
    const secondary = getSecondary ? (getSecondary(item) ?? undefined) : undefined;
    const bucket = scoreSearch(q, name, secondary);
    if (bucket !== null) {
      scored.push({ item, bucket, name: norm(name) });
    }
  }

  scored.sort((a, b) => {
    if (a.bucket !== b.bucket) return a.bucket - b.bucket;
    return a.name.localeCompare(b.name);
  });

  return scored.slice(0, limit).map((s) => s.item);
}
