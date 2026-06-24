export interface Publisher {
  name: string;      // current canonical name
  url: string;
  patterns: string[]; // matched against normalized MARC 260$b (lowercase, hyphens→space)
}

export interface PublisherMatch {
  publisher: Publisher;
  displayName: string; // raw MARC value, or "raw (canonical)" if name changed
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»"'.,;:!?()\[\]{}\\/]/g, ' ')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check if the raw MARC publisher name is essentially the same as the canonical name.
// If not, we show "raw (canonical)" so users know the publisher was renamed.
function isSameName(raw: string, canonical: string): boolean {
  const a = normalize(raw);
  const b = normalize(canonical);
  return a === b || a.includes(b) || b.includes(a);
}

export const PUBLISHERS: Publisher[] = [
  // ─── Contemporary fiction & general ───────────────────────────────────────
  {
    name: 'Видавництво Старого Лева',
    url: 'https://starylev.com.ua',
    patterns: ['видавництво старого лева', 'видавн старого лева', 'вид старого лева', 'всл', 'старого лева'],
  },
  {
    name: 'Vivat',
    url: 'https://vivat.com.ua',
    patterns: ['vivat', 'вівіат', 'віват'],
  },
  {
    // КМ-Букс rebranded to Stone Publishing in August 2025.
    // "Країна Мрій" was the earlier identity of the same publisher chain.
    name: 'Stone Publishing',
    url: 'https://stonepublishing.com.ua',
    patterns: ['stone publishing', 'км букс', 'кмбукс', 'km buks', 'km books', 'країна мрій'],
  },
  {
    name: 'BookChef',
    url: 'https://bookchef.ua',
    patterns: ['bookchef', 'book chef'],
  },
  {
    name: 'Клуб Сімейного Дозвілля',
    url: 'https://ksd.ua',
    patterns: ['клуб сімейного дозвілля', 'ксд', 'ksd'],
  },
  {
    name: 'Фоліо',
    url: 'https://folio.com.ua',
    patterns: ['фоліо'],
  },
  {
    name: 'Ранок',
    url: 'https://ranok.com.ua',
    patterns: ['ранок'],
  },
  {
    name: 'А-БА-БА-ГА-ЛА-МА-ГА',
    url: 'https://ababahalamaha.com.ua',
    patterns: ['а ба ба га ла ма га', 'абабагаламага', 'ababahalamaha'],
  },
  {
    name: 'Астролябія',
    url: 'https://astrolabium.com.ua',
    patterns: ['астролябія', 'астролабіум'],
  },
  {
    name: 'Основи',
    url: 'https://osnovypublishing.com',
    patterns: ['основи'],
  },
  {
    name: 'Темпора',
    url: 'https://tempora.com.ua',
    patterns: ['темпора'],
  },
  {
    name: 'Наш Формат',
    url: 'https://nashformat.ua',
    patterns: ['наш формат'],
  },
  {
    name: 'ArtHuss',
    url: 'https://arthuss.com.ua',
    patterns: ['arthuss', 'art huss'],
  },
  {
    name: 'Фабула',
    url: 'https://fabulabook.com',
    patterns: ['фабула'],
  },
  {
    name: 'Meridian Czernowitz',
    url: 'https://meridiancz.com',
    patterns: ['meridian czernowitz', 'меридіан чернівці'],
  },
  {
    name: 'Видавництво 21',
    url: 'https://books-xxi.com.ua',
    patterns: ['видавництво 21', 'вид 21', 'books xxi', 'books-xxi'],
  },
  {
    name: 'Laurus',
    url: 'https://laurus.ua',
    patterns: ['laurus', 'лаурус'],
  },
  {
    name: 'Дух і Літера',
    url: 'https://duh-i-litera.com',
    patterns: ['дух і літера', 'дух і літ'],
  },
  {
    name: 'Критика',
    url: 'https://krytyka.com',
    patterns: ['критика'],
  },
  {
    name: 'Смолоскип',
    url: 'https://smoloskyp.com.ua',
    patterns: ['смолоскип'],
  },
  {
    name: 'Кальварія',
    url: 'https://calvaria.org.ua',
    patterns: ['кальварія'],
  },
  {
    name: 'Навчальна книга — Богдан',
    url: 'https://bohdan-books.com',
    patterns: ['навчальна книга богдан', 'нова книга богдан', 'богдан'],
  },
  {
    name: 'Комора',
    url: 'https://komorabooks.com',
    patterns: ['комора'],
  },
  {
    name: 'Урбіно',
    url: 'https://urbino.com.ua',
    patterns: ['урбіно', 'urbino'],
  },
  {
    name: 'Грані-Т',
    url: 'https://grani-t.com.ua',
    patterns: ['грані т'],
  },
  {
    name: 'Discursus',
    url: 'https://brustury.com.ua',
    patterns: ['discursus', 'дискурсус', 'брустури'],
  },
  {
    name: 'Генеза',
    url: 'https://geneza.ua',
    patterns: ['генеза'],
  },
  {
    name: 'Либідь',
    url: 'https://lybid.org.ua',
    patterns: ['либідь'],
  },
  {
    name: 'Наукова думка',
    url: 'https://ndumka.kiev.ua',
    patterns: ['наукова думка'],
  },
  {
    name: 'Академія',
    url: 'https://academia-pc.com.ua',
    patterns: ['академвидав', 'видавничий центр академія', 'вц академія', 'academia'],
  },
  {
    name: 'Знання',
    url: 'https://znannia.com.ua',
    patterns: ['знання'],
  },
  {
    name: 'Вища школа',
    url: 'https://vyshcha-shkola.com.ua',
    patterns: ['вища школа'],
  },
  {
    name: 'Твердиня',
    url: 'https://tverdyna.ucoz.ua',
    patterns: ['твердиня'],
  },
  {
    name: 'Махаон-Україна',
    url: 'https://machaon.ua',
    patterns: ['махаон', 'mahaon', 'mahhaon', 'machaon'],
  },
  {
    name: 'IST Publishing',
    url: 'https://istpublishing.org',
    patterns: ['ist publishing', 'ist publish', 'іст паблішинг'],
  },
  {
    name: 'Зелений пес',
    url: 'https://greenpes.com',
    patterns: ['зелений пес'],
  },
  {
    name: 'Моноліт',
    url: 'https://monolith.in.ua',
    patterns: ['моноліт'],
  },
  {
    name: 'Форс Україна',
    url: 'https://forsukraine.com',
    patterns: ['форс україна', 'форс укра'],
  },
  {
    name: 'Піраміда',
    url: 'https://piramidabooks.net',
    patterns: ['піраміда', 'ла піраміда', 'літературна агенція піраміда'],
  },
  {
    name: 'Веселка',
    url: 'https://veselka.in.ua',
    patterns: ['веселка'],
  },
  {
    name: 'Дніпро',
    url: 'https://dnipro-ukr.com.ua',
    patterns: ['дніпро'],
  },

  // ─── New additions ─────────────────────────────────────────────────────────
  {
    name: 'Yakaboo Publishing',
    url: 'https://yakaboo.ua/ua/yakaboo-publisher',
    patterns: ['yakaboo publishing', 'якабу паблішинг', 'yakaboo'],
  },
  {
    name: 'Віхола',
    url: 'https://vikhola.com',
    patterns: ['віхола', 'vikhola'],
  },
  {
    name: 'Портал',
    url: 'https://portalbooks.com.ua',
    patterns: ['портал'],
  },
  {
    name: 'Видавничий дім КМА',
    url: 'http://publish-ukma.kiev.ua',
    patterns: ['видавничий дім києво могилянська академія', 'видавничий дім кма', 'вд кма', 'kyiv mohyla academy publishing'],
  },
  {
    name: 'Видавництво Жупанського',
    url: 'https://publisher.in.ua',
    patterns: ['жупанського', 'жупанський'],
  },
  {
    name: 'Юрінком Інтер',
    url: 'https://yurincom.com',
    patterns: ['юрінком інтер', 'юрінком'],
  },
  {
    name: 'Право',
    url: 'https://pravo-izdat.com.ua',
    patterns: ['право'],
  },
  {
    name: 'Акта',
    url: 'https://acta.com.ua',
    patterns: ['акта'],
  },
  {
    name: 'Рідна мова',
    url: 'https://ridna-mova.com',
    patterns: ['рідна мова', 'видавництво рм'],
  },
];

export function matchPublisher(rawName: string | undefined): PublisherMatch | null {
  if (!rawName) return null;
  const norm = normalize(rawName);
  for (const pub of PUBLISHERS) {
    for (const pattern of pub.patterns) {
      if (norm.includes(pattern)) {
        const displayName = isSameName(rawName, pub.name)
          ? rawName
          : `${rawName} (${pub.name})`;
        return { publisher: pub, displayName };
      }
    }
  }
  return null;
}
