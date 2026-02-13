import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="flex flex-col h-[100dvh] bg-slate-900">
      <main className="flex-1 overflow-y-auto scroll-container">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
