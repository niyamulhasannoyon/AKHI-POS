'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import GoogleAuthModal from '../auth/GoogleAuthModal';
import { farmStore } from '@/lib/store';
import { AuthUser } from '@/lib/types';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const update = () => {
      const st = farmStore.getState();
      setCurrentUser(st.currentUser || null);
    };

    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const shouldShowAuthGate = isMounted && !currentUser;

  return (
    <div className="flex min-h-screen bg-[#090d16] text-gray-100">
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header 
          onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)} 
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 lg:ml-64 min-w-0 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>

      {/* Google Sign-In Authentication Gate */}
      <GoogleAuthModal 
        isOpen={shouldShowAuthGate || isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}
