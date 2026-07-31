'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#090d16] text-gray-100">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 lg:ml-64 min-w-0 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
