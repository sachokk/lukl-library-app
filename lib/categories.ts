export interface Category {
  id: string;
  label: string;
  icon: string;
  subject: string; // WSU search query
  color: string;   // Tailwind background color class
}

export const CATEGORIES: Category[] = [
  { id: 'detective',   label: 'Детектив',        icon: '🔍', subject: 'Детектив',       color: 'bg-slate-100' },
  { id: 'fantasy',     label: 'Фантастика',       icon: '🚀', subject: 'Фантастика',     color: 'bg-indigo-50' },
  { id: 'thriller',    label: 'Трилер',           icon: '🎭', subject: 'Трилер',         color: 'bg-red-50' },
  { id: 'romance',     label: 'Любовний роман',   icon: '💖', subject: 'Любовний роман', color: 'bg-pink-50' },
  { id: 'novel',       label: 'Романи',           icon: '📖', subject: 'Роман',          color: 'bg-amber-50' },
  { id: 'poetry',      label: 'Поезія',           icon: '📜', subject: 'Поезія',         color: 'bg-yellow-50' },
  { id: 'fairy-tales', label: 'Казки',            icon: '🧚', subject: 'Казки',          color: 'bg-green-50' },
  { id: 'biography',   label: 'Біографії',        icon: '👤', subject: 'Біографії',      color: 'bg-orange-50' },
  { id: 'psychology',  label: 'Психологія',       icon: '🧠', subject: 'Психологія',     color: 'bg-violet-50' },
  { id: 'art',         label: 'Мистецтво',        icon: '🎨', subject: 'Мистецтво',      color: 'bg-fuchsia-50' },
  { id: 'medicine',    label: 'Медицина',         icon: '💊', subject: 'Медицина',       color: 'bg-teal-50' },
  { id: 'economics',   label: 'Економіка',        icon: '💰', subject: 'Економіка',      color: 'bg-lime-50' },
  { id: 'history',     label: 'Історія',          icon: '🏛️', subject: 'Історія',        color: 'bg-stone-100' },
  { id: 'cooking',     label: 'Кулінарія',        icon: '🍳', subject: 'Кулінарія',      color: 'bg-orange-100' },
  { id: 'self-dev',    label: 'Саморозвиток',     icon: '🌱', subject: 'Саморозвиток',   color: 'bg-emerald-50' },
];
