import type { Book, CatalogBook, CatalogResult, LibraryItem, SearchResult, SearchCode } from './types';

const XSERVER   = 'http://212.1.70.68';
const OPAC      = 'http://alpha.lukl.kyiv.ua';
const BASE      = 'lul01';
const DOC_LIB   = 'LUL01';

// ─── Entity decoding ─────────────────────────────────────────────────────────

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g,   '&')
    .replace(/&lt;/g,    '<')
    .replace(/&gt;/g,    '>')
    .replace(/&quot;/g,  '"')
    .replace(/&apos;/g,  "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g,  ' ')
    .replace(/&#(\d+);/g,        (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

// ─── XML helpers ─────────────────────────────────────────────────────────────

function extractFixfield(xml: string, id: string): string {
  const m = xml.match(new RegExp(`<fixfield id="${id}">([^<]*)<\\/fixfield>`));
  return m?.[1]?.trim() ?? '';
}

function extractVarfields(xml: string, id: string): string[] {
  const re = new RegExp(`<varfield id="${id}"[^>]*>([\\s\\S]*?)<\\/varfield>`, 'g');
  const blocks: string[] = [];
  let m;
  while ((m = re.exec(xml)) !== null) blocks.push(m[1]);
  return blocks;
}

function subfield(block: string, label: string): string {
  const m = block.match(new RegExp(`<subfield label="${label}">([^<]*)<\\/subfield>`));
  return decodeEntities(m?.[1]?.trim() ?? '');
}

// ─── MARC record → Book ───────────────────────────────────────────────────────

function parseRecord(recordXml: string): Book {
  const docNo = recordXml.match(/<doc_number>(\d+)<\/doc_number>/)?.[1] ?? '';

  const f245 = extractVarfields(recordXml, '245')[0] ?? '';
  const rawTitle      = subfield(f245, 'a').replace(/:$/, '').trim();
  const subtitle      = subfield(f245, 'b').replace(/\/$/, '').trim() || undefined;
  const responsibility = subfield(f245, 'c').trim() || undefined;

  const authors: string[] = [];
  const f100 = extractVarfields(recordXml, '100')[0];
  if (f100) {
    const name   = subfield(f100, 'a').replace(/,$/, '');
    const fuller = subfield(f100, 'q');
    authors.push(fuller ? `${name} ${fuller}` : name);
  }
  extractVarfields(recordXml, '700').forEach((f) => {
    const role = subfield(f, 'e');
    if (!role || role === 'пер.' || role === 'ред.') return;
    const name = subfield(f, 'a').replace(/,$/, '');
    if (name) authors.push(name);
  });

  const f260      = extractVarfields(recordXml, '260')[0] ?? '';
  const place     = subfield(f260, 'a').replace(/[:\[\]]/g, '').trim() || undefined;
  const publisher = subfield(f260, 'b').replace(/,$/, '').trim() || undefined;
  const year      = subfield(f260, 'c').replace(/[.\[\]]/g, '').trim() || undefined;

  const f020 = extractVarfields(recordXml, '020');
  const isbn = (f020.map((f) => subfield(f, 'a')).find((v) => v) ||
    f020.map((f) => subfield(f, 'z')).find((v) => v))?.trim();

  const pages = subfield(extractVarfields(recordXml, '300')[0] ?? '', 'a').trim() || undefined;

  const subjects = extractVarfields(recordXml, '650').map((f) => {
    const parts = [subfield(f, 'a'), subfield(f, 'x')].filter(Boolean);
    return parts.join(' — ');
  });

  const genres = extractVarfields(recordXml, '655')
    .map((f) => subfield(f, 'a').replace(/\.$/, '').trim())
    .filter(Boolean);

  const udc = subfield(extractVarfields(recordXml, '080')[0] ?? '', 'a') || undefined;

  return {
    sysNo: docNo,
    title: rawTitle,
    subtitle,
    responsibility,
    authors,
    place,
    publisher,
    year,
    isbn,
    pages,
    subjects,
    genres,
    udc,
  };
}

// ─── Items (availability) — OPAC HTML scraper ─────────────────────────────────
//
// The X-Server op=item is not available on this installation.
// The OPAC page func=item-global returns HTML with embedded item rows.
//
// Each row is wrapped in:
//   <!--filename: item-global-body-->
//   <tr>…</tr>
//   <!-- END filename: item-global-body -->
//
// Cell layout (zero-indexed <td> children of the <tr>):
//   [0]  operation links — contains sub_library=XXX in a JS string
//   [1]  description
//   [2]  loan type  ("На місяць", "На ніч", "Доступний", "В обробці")
//   [3]  due date / shelf status
//          • green SVG + "Ha пoлицi." → on shelf (available)
//          • plain date              → checked out
//          • "В обробці"             → in processing
//   [4]  sub-library name
//   [8]  call number (шифр)

function stripTags(html: string): string {
  // Replace block-level and line-break tags with a newline so text from separate
  // cells/lines isn't concatenated without any separator (e.g. "Видано<br>Замовлено")
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(p|div|li|tr|td|th)[^>]*>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  ).replace(/\n{2,}/g, '\n').trim();
}

function parseItemHtml(html: string): LibraryItem[] {
  const items: LibraryItem[] = [];
  const rowRe = /<!--filename: item-global-body-->\s*<tr>([\s\S]*?)<\/tr>\s*[\s\S]*?END filename: item-global-body/g;

  let rowMatch;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];

    // sublibrary code lives in the JS: sub_library=XXX >
    const codeMatch = row.match(/sub_library=(\w+)\s*>/);
    const sublibraryCode = codeMatch?.[1]?.trim() ?? '';

    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRe.exec(row)) !== null) {
      cells.push(cellMatch[1]);
    }

    if (cells.length < 5) continue;

    const loanType    = stripTags(cells[2]);
    const dueCellRaw  = cells[3];
    const onShelf     = dueCellRaw.includes('fill="green"');
    const dueDateText = stripTags(dueCellRaw);
    const sublibrary  = stripTags(cells[4]);
    const callNumber  = cells.length > 8 ? stripTags(cells[8]) || undefined : undefined;

    const isInProcess = loanType === 'В обробці';
    const dueDate = (!onShelf && !isInProcess && dueDateText && dueDateText !== 'В обробці')
      ? dueDateText
      : undefined;

    if (!sublibraryCode && !sublibrary) continue;

    items.push({ sublibraryCode, sublibrary, loanType, onShelf, dueDate, callNumber });
  }

  return items;
}

// ─── OPAC search result parser ────────────────────────────────────────────────
//
// The OPAC's func=find-b supports combined WSU (subject) + WSBL (sublibrary) filtering,
// which the X-Server does not. We parse the HTML results to get doc numbers and
// basic metadata (author, title, year) without needing a separate MARC fetch.
//
// Each result row follows this template:
//   <!-- filename: short-a-body-->
//   <tr …>
//     …<script>…document.write('>'); </script> AUTHOR </a>…
//     …<script>…document.write('>'); </script> TITLE / RESPONSIBILITY </a>…
//     <td …>YEAR  </td>
//     …doc_number=XXXXXXXXX…
//   </tr>
//   <!-- END filename: short-a-body-lul01 -->

interface OpaParseResult extends CatalogResult {
  session?: string; // OPAC session token for page 2+ navigation
}

function parseOpaSearchHtml(html: string): OpaParseResult {
  const total = parseInt(
    html.match(/Records\s+\d+\s*-\s*\d+\s+of\s+(\d+)/)?.[1] ?? '0',
    10,
  );

  // Extract session token from the next-page URL, if present
  const sessionMatch = html.match(/\/F\/([A-Z0-9-]+)\?func=short-jump/);
  const session = sessionMatch?.[1];

  const books: CatalogBook[] = [];

  const rowRe =
    /<!-- filename: short-a-body-->\s*<tr[^>]*>([\s\S]*?)<\/tr>\s*<!-[\s\S]*?END filename: short-a-body-lul01/g;

  let rowMatch;
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1];

    const docMatch = row.match(/doc_number=(\d{9})/);
    if (!docMatch) continue;
    const sysNo = docMatch[1];

    // Pairs of: document.write('>'); </script> CONTENT </a>
    const writeRe = /document\.write\('>'\); <\/script> ([\s\S]*?)<\/a>/g;
    const fragments: string[] = [];
    let wm;
    while ((wm = writeRe.exec(row)) !== null) {
      fragments.push(decodeEntities(wm[1].replace(/&nbsp;/g, ' ')).trim());
    }

    const authorRaw = fragments[0] ?? '';
    const titleRaw  = fragments[1] ?? '';

    // Title: strip the " / Responsibility." suffix
    const title = titleRaw.replace(/\s*\/\s*.+$/, '').replace(/\s+$/, '').trim();

    const author = authorRaw.replace(/,$/, '').trim();
    const authors = author ? [author] : [];

    const yearMatch = row.match(/<td class=td1\s+width=""\s+valign=top>(\d{4})\s*<\/td>/);
    const year = yearMatch?.[1];

    if (sysNo && title) {
      books.push({ sysNo, title, authors, year });
    }
  }

  return { books, total, session };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchBooks(
  query: string,
  searchCode: SearchCode = 'WRD',
  start = 1,
  count = 20,
): Promise<SearchResult> {
  const findUrl = `${XSERVER}/X?op=find&code=${searchCode}&request=${encodeURIComponent(query)}&base=${BASE}`;
  const findRes = await fetch(findUrl, { cache: 'no-store' });
  const findXml = await findRes.text();

  const setNumber = findXml.match(/<set_number>(\d+)<\/set_number>/)?.[1];
  const total     = parseInt(findXml.match(/<no_records>(\d+)<\/no_records>/)?.[1] ?? '0', 10);

  if (!setNumber || total === 0) return { books: [], total: 0 };

  const end = Math.min(start + count - 1, total);
  const presentUrl = `${XSERVER}/X?op=present&set_number=${setNumber}&set_entry=${start}-${end}&format=marc`;
  const presentRes = await fetch(presentUrl, { cache: 'no-store' });
  const presentXml = await presentRes.text();

  const records = [...presentXml.matchAll(/<record>([\s\S]*?)<\/record>/g)].map((m) => m[1]);
  const books   = records.map(parseRecord);

  return { books, total, setNumber };
}

export async function getItemAvailability(sysNo: string): Promise<LibraryItem[]> {
  const url = `${OPAC}/F?func=item-global&doc_library=${DOC_LIB}&doc_number=${sysNo}`;
  const res  = await fetch(url, { cache: 'no-store' });
  const html = await res.text();
  return parseItemHtml(html);
}

// searchCatalog: subject-filtered search using OPAC HTML (supports sublibrary filter).
// sublibraryCode: one of the WSBL codes (e.g. '156' = Абонемент of the main library).
// For page 1, pass session = undefined. For pages 2+, pass the session token returned
// from page 1. The result always includes an updated session for the next page.
export async function searchCatalog(
  subject: string,
  sublibraryCode = '156',
  page = 1,
  session?: string,
): Promise<CatalogResult & { session?: string }> {
  let url: string;

  if (page === 1 || !session) {
    const params = new URLSearchParams({
      func:             'find-b',
      request:          subject,
      find_code:        'WSU',
      filter_code_4:    'WSBL',
      filter_request_4: sublibraryCode,
      local_base:       BASE,
    });
    url = `${OPAC}/F?${params}`;
  } else {
    // Pages 2+: use session-based navigation
    const jump = String((page - 1) * 20 + 1).padStart(6, '0');
    url = `http://alpha.lukl.kyiv.ua:80/F/${session}?func=short-jump&jump=${jump}`;
  }

  const res  = await fetch(url, { cache: 'no-store' });
  const html = await res.text();
  return parseOpaSearchHtml(html);
}

// Returns first OPAC page (up to 20 books) for the current year.
// `total` reflects the real count — use it to show "X more" links in the UI.
export async function getNewArrivals(sublibraryCode = '156'): Promise<CatalogResult> {
  const year = new Date().getFullYear();
  const params = new URLSearchParams({
    func:             'find-b',
    request:          String(year),
    find_code:        'WYR',
    filter_code_4:    'WSBL',
    filter_request_4: sublibraryCode,
    local_base:       BASE,
  });
  const url = `${OPAC}/F?${params}`;
  const res  = await fetch(url, { next: { revalidate: 3600 } });
  const html = await res.text();
  return parseOpaSearchHtml(html); // naturally ≤ 20 books (one OPAC page)
}

export async function getBookByDocNumber(sysNo: string): Promise<Book | null> {
  const findUrl = `${XSERVER}/X?op=find&code=SYS&request=${sysNo}&base=${BASE}`;
  const findRes = await fetch(findUrl, { cache: 'no-store' });
  const findXml = await findRes.text();
  const setNumber = findXml.match(/<set_number>(\d+)<\/set_number>/)?.[1];
  if (!setNumber) return null;

  const presentUrl = `${XSERVER}/X?op=present&set_number=${setNumber}&set_entry=1-1&format=marc`;
  const presentRes = await fetch(presentUrl, { cache: 'no-store' });
  const presentXml = await presentRes.text();
  const records    = [...presentXml.matchAll(/<record>([\s\S]*?)<\/record>/g)];
  if (!records.length) return null;
  return parseRecord(records[0][1]);
}
