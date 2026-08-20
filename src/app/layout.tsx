import type { Metadata, Viewport } from 'next';
import './globals.css';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'AKHI POS - Smart Poultry Farm & Business Management System Pro',
  description: 'Enterprise Poultry Farm Management, Khamar Batch Tracker & Point of Sale (POS) System',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/apple-touch-icon.png',
      },
    ],
  },
  openGraph: {
    title: 'AKHI POS - Smart Poultry Farm & Business Management System Pro',
    description: 'Enterprise Poultry Farm Management & Point of Sale System',
    images: ['/images/logo.svg', '/logo.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#090d16] text-gray-100 min-h-screen" suppressHydrationWarning>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
