export interface Book {
  sysNo: string;
  title: string;
  subtitle?: string;
  responsibility?: string;
  authors: string[];
  publisher?: string;
  place?: string;
  year?: string;
  isbn?: string;
  pages?: string;
  subjects: string[];
  genres: string[];
  udc?: string;
}

export interface LibraryItem {
  sublibraryCode: string; // e.g. '156', 'OI', '010'
  sublibrary: string;     // e.g. 'Абонемент', 'ім. В.Стуса'
  loanType: string;       // e.g. 'На місяць', 'Доступний', 'В обробці'
  onShelf: boolean;       // true when green SVG present
  dueDate?: string;       // populated when not on shelf and not "в обробці"
  callNumber?: string;
}

export interface CatalogBook {
  sysNo: string;
  title: string;
  authors: string[];
  year?: string;
}

export interface CatalogResult {
  books: CatalogBook[];
  total: number;
  session?: string; // OPAC session token for pages 2+ (short-jump navigation)
}

export interface BookEnrichment {
  coverUrl?: string;
  description?: string;
  rating?: number;       // e.g. 3.68
  ratingCount?: number;  // e.g. 351917
  source?: 'goodreads' | 'google' | 'openlibrary';
}

export interface SearchResult {
  books: Book[];
  total: number;
  setNumber?: string;
}

export type SearchCode =
  | 'WRD' // Будь-яке слово
  | 'WTI' // За назвою
  | 'WAU' // За автором
  | '020' // За ISBN
  | 'WSU' // За темою
  | 'SYS'; // За системним номером
