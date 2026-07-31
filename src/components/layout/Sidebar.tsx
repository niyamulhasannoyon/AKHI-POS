'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { farmStore } from '@/lib/store';
import { 
  LayoutDashboard, 
  ShoppingBag,
  Bird, 
  Package, 
  Users, 
  Building2, 
  Receipt, 
  Landmark, 
  Clock, 
  BarChart3, 
  UserCheck,
  X,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'Cashier', 'Sales Operator'] },
  { label: 'POS Cash Register', href: '/pos', icon: ShoppingBag, highlight: true, roles: ['Admin', 'Manager', 'Cashier', 'Sales Operator'] },
  { label: 'Customer Ledgers', href: '/customers', icon: Users, roles: ['Admin', 'Manager', 'Cashier', 'Sales Operator'] },
  { label: 'Products & Stock', href: '/inventory', icon: Package, roles: ['Admin', 'Manager'] },
  { label: 'Khamar Management', href: '/khamar', icon: Bird, roles: ['Admin', 'Manager'] },
  { label: 'Supplier Ledgers', href: '/suppliers', icon: Building2, roles: ['Admin', 'Manager'] },
  { label: 'Installments', href: '/installments', icon: Clock, roles: ['Admin', 'Manager'] },
  { label: 'Farm Accounting', href: '/accounting', icon: Receipt, roles: ['Admin'] },
  { label: 'Loans & EMI', href: '/loans', icon: Landmark, roles: ['Admin'] },
  { label: 'Business Analytics', href: '/analytics', icon: BarChart3, roles: ['Admin'] },
  { label: 'HR & Payroll', href: '/hr', icon: UserCheck, roles: ['Admin'] },
];

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string>('Admin');
  const [userName, setUserName] = useState<string>('অ্যাডমিন');
  const [userPicture, setUserPicture] = useState<string | undefined>(undefined);

  useEffect(() => {
    const update = () => {
      const user = farmStore.getState().currentUser;
      setUserRole(user?.role || 'Admin');
      setUserName(user?.name || 'অ্যাডমিন');
      setUserPicture(user?.picture);
    };
    update();
    const unsub = farmStore.subscribe(update);
    return () => unsub();
  }, []);

  const visibleNavItems = navItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`w-64 bg-[#0b111c]/95 backdrop-blur-xl border-r border-white/10 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <Link 
            href="/" 
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 hover:opacity-90 transition cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-900/30 border border-emerald-500/30 flex-shrink-0 group-hover:scale-105 transition-transform bg-[#090d16]">
              <img src="/logo.png" alt="AKHI POS" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400 text-lg leading-tight">
                AKHI POS
              </h1>
              <p className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase">{userRole} PANEL</p>
            </div>
          </Link>

          {/* Close button on mobile screens */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/khamar' && pathname === '/khamari');

            let classNames = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ";
            
            if (isActive) {
              classNames += "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-white border border-emerald-500/40 shadow-md shadow-emerald-950/50";
            } else if (item.highlight) {
              classNames += "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-white";
            } else {
              classNames += "text-gray-400 hover:text-white hover:bg-white/5";
            }

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setIsMobileOpen(false)}
                className={classNames}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Role Footer Badge */}
        <div className="p-3 border-t border-white/10 bg-slate-900/50 text-xs">
          <div className="flex items-center gap-2.5 text-gray-300">
            {userPicture ? (
              <img 
                src={userPicture} 
                alt={userName} 
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-emerald-500/40 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=10b981&color=fff`;
                }}
              />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            )}
            <div className="truncate">
              <div className="font-bold text-white truncate text-xs">{userName}</div>
              <div className="text-[10px] text-emerald-400 font-semibold uppercase">{userRole} এক্সেস মোড</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
