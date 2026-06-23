export interface BranchInfo {
  address: string;
  district?: string;
}

// Map sublibrary CODE (as returned by OPAC) → address info.
// Run the app, open a popular book, and look at the "Інші бібліотеки" section
// to find what codes / names the OPAC returns — then add entries here.
const BRANCH_INFO: Record<string, BranchInfo> = {
  // ── Main building codes (156,157,158,OI,OZL,KRA,ONO,INT) are intentionally
  //    omitted — their section heading already identifies them as the main
  //    library, no address needed.

  // ── Branch libraries — add entries as you discover codes ─────────────────
  // Run the app, open a popular book, expand "Інші бібліотеки мережі", and
  // check the sublibraryCode in browser DevTools (or add console.log).
  // Format: 'CODE': { address: 'вул. Олександра Кониського, 83-85', district: 'Шевченківський' },
  //
  // Note: use post-decommunisation street names where applicable, e.g.
  //   вул. Тургенєвська  →  вул. Олександра Кониського
  //   вул. Артема        →  вул. Сікорського
  //   пр. Перемоги       →  пр. Берестейський
};

export function getBranchInfo(code: string): BranchInfo | undefined {
  return BRANCH_INFO[code];
}
