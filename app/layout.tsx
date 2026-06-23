import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { LibraryNav } from '@/components/LibraryNav';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Каталог — б-ка ім. Лесі Українки',
  description: 'Зручний пошук по каталогу Публічної бібліотеки ім. Лесі Українки',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className={inter.variable}>
      <body className="font-sans antialiased">
        <LibraryNav />
        {children}
      </body>
    </html>
  );
}
