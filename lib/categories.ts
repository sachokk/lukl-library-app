export interface Category {
  id: string;
  label: string;
  subject: string;   // search term
  findCode?: string; // OPAC find_code (default: WSU)
  icon?: string;
}

export interface GenreGroup {
  id: string;
  label: string;
  genres: Category[];
}

// Fiction genres from MARC 655 field — counts from ALEPH catalog
export const GENRE_GROUPS: GenreGroup[] = [
  {
    id: 'detective',
    label: 'Детектив і трилер',
    genres: [
      { id: 'detective',    label: 'Детектив',              subject: 'Детектив' },
      { id: 'thriller',     label: 'Трилер',                subject: 'Трилер' },
      { id: 'action-prose', label: 'Гостросюжетна проза',   subject: 'Гостросюжетна проза' },
    ],
  },
  {
    id: 'scifi',
    label: 'Фантастика і фентезі',
    genres: [
      { id: 'fantasy',   label: 'Фентезі',              subject: 'Фентезі' },
      { id: 'scifi',     label: 'Фантастика',            subject: 'Фантастика' },
    ],
  },
  {
    id: 'novels',
    label: 'Романи і проза',
    genres: [
      { id: 'romance',      label: 'Любовний роман',      subject: 'Любовний роман' },
      { id: 'adventure',    label: 'Пригоди',             subject: 'Пригоди' },
      { id: 'psychological',label: 'Психологічна проза',  subject: 'Психологічна проза' },
      { id: 'war-prose',    label: 'Воєнна проза',        subject: 'Воєнна проза' },
      { id: 'historical',   label: 'Історична проза',     subject: 'Історична проза' },
      { id: 'social-prose', label: 'Соціально-побутова',  subject: 'Соціально-побутова проза' },
      { id: 'coming-of-age',label: 'Роман виховання',     subject: 'Роман виховання' },
      { id: 'saga',         label: 'Сага',                subject: 'сага', findCode: 'WRD' },
    ],
  },
  {
    id: 'contemporary',
    label: 'Сучасна проза',
    genres: [
      { id: 'ukr-prose',     label: 'Українська сучасна', subject: 'Проза сучасна українська' },
      { id: 'foreign-prose', label: 'Зарубіжна сучасна',  subject: 'Проза сучасна зарубіжна' },
    ],
  },
  {
    id: 'classics',
    label: 'Класика',
    genres: [
      { id: 'foreign-classics', label: 'Зарубіжна класика',  subject: 'Зарубіжна класика' },
      { id: 'ukr-classics',     label: 'Українська класика',  subject: 'Українська класика' },
    ],
  },
  {
    id: 'poetry',
    label: 'Поезія і драма',
    genres: [
      { id: 'poetry',    label: 'Поезія',     subject: 'Поезія' },
      { id: 'drama',     label: 'Драма',      subject: 'Драма' },
      { id: 'satire',    label: 'Сатира',     subject: 'Сатира' },
      { id: 'humor',     label: 'Гумор',      subject: 'Гумор' },
    ],
  },
  {
    id: 'children',
    label: 'Дитяча і юнацька',
    genres: [
      { id: 'fairy-tales', label: 'Казки',           subject: 'Казки' },
      { id: 'children-lit',label: 'Для дітей',        subject: 'Для дітей' },
      { id: 'teen',        label: 'Для підлітків',    subject: 'Для підлітків' },
    ],
  },
  {
    id: 'biography',
    label: 'Біографія і документальна',
    genres: [
      { id: 'biography',     label: 'Біографія',          subject: 'Біографія' },
      { id: 'art-biography', label: 'Художня біографія',  subject: 'Художня біографія' },
      { id: 'memoirs',       label: 'Мемуари',            subject: 'Мемуари' },
    ],
  },
  {
    id: 'other',
    label: 'Інше',
    genres: [
      { id: 'horror',  label: 'Жахи',    subject: 'Жахи' },
      { id: 'gothic',  label: 'Готика',  subject: 'Готика' },

      { id: 'comics',  label: 'Комікси', subject: 'Комікси' },
    ],
  },
];

// Non-fiction subject categories from MARC 650 — for "Тематичні розділи" section
export const SUBJECT_CATEGORIES: Category[] = [
  { id: 'history',     label: 'Історія',              icon: '🏛️', subject: 'Історія' },
  { id: 'psychology',  label: 'Психологія',            icon: '🧠', subject: 'Психологія' },
  { id: 'art',         label: 'Мистецтво',             icon: '🎨', subject: 'Мистецтво' },
  { id: 'economics',   label: 'Економіка',             icon: '💰', subject: 'Економіка' },
  { id: 'law',         label: 'Право',                 icon: '⚖️', subject: 'Право' },
  { id: 'medicine',    label: 'Медицина',              icon: '💊', subject: 'Медицина' },
  { id: 'pedagogy',    label: 'Педагогіка',            icon: '🎓', subject: 'Педагогіка' },
  { id: 'philosophy',  label: 'Філософія',             icon: '🤔', subject: 'Філософія' },
  { id: 'it',          label: 'Інформатика',           icon: '💻', subject: 'Інформатика' },
  { id: 'languages',   label: 'Мовознавство',          icon: '📖', subject: 'Мовознавство' },
  { id: 'cooking',     label: 'Кулінарія',             icon: '🍳', subject: 'Кулінарія' },
  { id: 'self-dev',    label: 'Саморозвиток',          icon: '🌱', subject: 'Саморозвиток' },
  { id: 'architecture',label: 'Архітектура',           icon: '🏗️', subject: 'Архітектура' },
  { id: 'religion',    label: 'Релігія',               icon: '⛪', subject: 'Релігія' },
  { id: 'sports',      label: 'Фізкультура і спорт',  icon: '🏋️', subject: 'Спорт' },
  { id: 'geography',   label: 'Географія',             icon: '🌍', subject: 'Географія' },
  { id: 'bilingual',   label: 'Двомовні книги',        icon: '🌐', subject: 'білінгва', findCode: 'WRD' },
];

// Flat lookup across all genres and categories
export const ALL_CATALOG_ITEMS: Category[] = [
  ...GENRE_GROUPS.flatMap((g) => g.genres),
  ...SUBJECT_CATEGORIES,
];

// Legacy export — used by older import sites
export const CATEGORIES = SUBJECT_CATEGORIES;
