'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Bird, 
  CalendarCheck, 
  Wheat, 
  Package, 
  Users, 
  Building2, 
  Receipt, 
  Landmark, 
  Clock, 
  BarChart3, 
  UserCheck 
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Point of Sale (F2)', href: '/pos', icon: ShoppingCart, highlight: true },
  { label: 'Khamar Batches', href: '/khamar', icon: Bird },
  { label: 'Daily Khamari Entry', href: '/khamari', icon: CalendarCheck, gold: true },
  { label: 'Feed & Gura Engine', href: '/feed-gura', icon: Wheat },
  { label: 'Products & Stock', href: '/inventory', icon: Package },
  { label: 'Customer Ledgers', href: '/customers', icon: Users },
  { label: 'Supplier Ledgers', href: '/suppliers', icon: Building2 },
  { label: 'Farm Accounting', href: '/accounting', icon: Receipt },
  { label: 'Loans & EMI', href: '/loans', icon: Landmark },
  { label: 'Installments', href: '/installments', icon: Clock },
  { label: 'Business Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'HR & Payroll', href: '/hr', icon: UserCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0b111c]/95 backdrop-blur-xl border-r border-white/10 flex flex-col fixed inset-y-0 left-0 z-40">
      <div className="h-16 px-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg shadow-emerald-900/30">
          🐔
        </div>
        <div>
          <h1 className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400 text-lg leading-tight">
            AKHI POS
          </h1>
          <p className="text-[10px] tracking-widest text-gray-400 uppercase">NEXTJS PRO 4.0</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          let classNames = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ";
          
          if (isActive) {
            classNames += "bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-white border border-emerald-500/40 shadow-md shadow-emerald-950/50";
          } else if (item.highlight) {
            classNames += "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 hover:text-white";
          } else {
            classNames += "text-gray-400 hover:text-white hover:bg-white/5";
          }

          return (
            <Link key={item.href} href={item.href} className={classNames}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : item.gold ? 'text-amber-400' : ''}`} />
              <span className={item.gold && !isActive ? 'text-amber-400 font-semibold' : ''}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
