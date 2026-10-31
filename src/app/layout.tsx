import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument' });

export const metadata: Metadata = {
  title: 'Language Help BD — Learn Languages, Beautifully',
  description:
    'Language Help BD is a modern language training institution offering English, IELTS, Japanese, Korean and Arabic courses with expert mentors.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrument.variable}`}>
      <body className="bg-white text-[#1A1A1A] antialiased">{children}</body>
    </html>
  );
}
