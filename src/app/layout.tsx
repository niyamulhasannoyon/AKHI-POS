import type { Metadata, Viewport } from 'next';
import './globals.css';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'AKHI POS - Smart Poultry Farm & Business Management System Pro',
  description: 'Enterprise Poultry Farm Management, Khamar Batch Tracker & Point of Sale (POS) System',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'AKHI POS - Smart Poultry Farm & Business Management System Pro',
    description: 'Enterprise Poultry Farm Management & Point of Sale System',
    images: ['/logo.png'],
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
