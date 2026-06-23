export interface ShelfBook {
  sysNo: string;
  title: string;
  authors: string[];
  year?: string;
}

const SHELF_KEY = 'library_shelf_v1';

export function getShelf(): ShelfBook[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SHELF_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function isOnShelf(sysNo: string): boolean {
  return getShelf().some((b) => b.sysNo === sysNo);
}

export function addToShelf(book: ShelfBook): void {
  const shelf = getShelf().filter((b) => b.sysNo !== book.sysNo);
  shelf.unshift(book);
  localStorage.setItem(SHELF_KEY, JSON.stringify(shelf));
}

export function removeFromShelf(sysNo: string): void {
  const shelf = getShelf().filter((b) => b.sysNo !== sysNo);
  localStorage.setItem(SHELF_KEY, JSON.stringify(shelf));
}

export function toggleShelf(book: ShelfBook): boolean {
  if (isOnShelf(book.sysNo)) {
    removeFromShelf(book.sysNo);
    return false;
  }
  addToShelf(book);
  return true;
}

export function clearShelf(): void {
  localStorage.removeItem(SHELF_KEY);
}
