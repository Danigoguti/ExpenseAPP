import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Upload } from 'lucide-react';

const tabs = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/import', icon: Upload, label: 'Import' },
] as const;

export default function BottomNav() {
  return (
    <nav
      className="flex items-center justify-around bg-slate-900/80 backdrop-blur-xl border-t border-slate-800"
      style={{ paddingBottom: `var(--sab)` }}
    >
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-2 px-4 text-xs transition-colors ${
              isActive ? 'text-sky-400' : 'text-slate-500'
            }`
          }
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
