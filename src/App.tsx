import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';

const DashboardPage = lazy(() => import('./components/dashboard/DashboardPage'));
const TransactionsPage = lazy(() => import('./components/transactions/TransactionsPage'));
const ImportPage = lazy(() => import('./components/import/ImportPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="import" element={<ImportPage />} />
          </Route>
        </Routes>
      </Suspense>
      <PWAInstallPrompt />
    </BrowserRouter>
  );
}

export default App;
