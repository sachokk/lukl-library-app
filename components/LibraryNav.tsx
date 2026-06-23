'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, BookOpen, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/',             label: 'Пошук',   icon: Search,    exact: true  },
  { href: '/catalog',      label: 'Каталог', icon: BookOpen,  exact: false },
  { href: '/new-arrivals', label: 'Новинки', icon: Sparkles,  exact: false },
];

export function LibraryNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
        <Link href="/" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Публічна бібліотека імені Лесі Українки"
            className="h-[64px] w-auto sm:h-[132px]"
          />
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-2 sm:px-3 transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5 sm:h-4 sm:w-4', active ? 'text-primary' : 'text-muted-foreground/70')} />
                <span className={cn('hidden text-sm font-medium sm:inline', active ? 'text-primary' : '')}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* divider */}
          <span className="mx-1 h-5 w-px bg-border sm:mx-2" />

          <Link
            href="/shelf"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-2 sm:px-3 transition-colors',
              pathname === '/shelf'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Heart
              className={cn(
                'h-5 w-5 sm:h-4 sm:w-4',
                pathname === '/shelf' ? 'fill-primary text-primary' : 'text-muted-foreground/70',
              )}
            />
            <span className={cn('hidden text-sm font-medium sm:inline', pathname === '/shelf' ? 'text-primary' : '')}>
              Полиця
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
