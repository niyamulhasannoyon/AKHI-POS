import type { Metadata } from 'next';
import './globals.css';
import MainLayout from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Akhi Poultry Farm - Smart POS & Farm Management System Pro',
  description: 'Enterprise Poultry Farm Management & Point of Sale System built with Next.js',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#090d16] text-gray-100 min-h-screen">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
