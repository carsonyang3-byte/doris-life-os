import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ReflectPage from './pages/ReflectPage';
import GoalsPage from './pages/GoalsPage';
import LibraryPage from './pages/LibraryPage';
import MoneyPage from './pages/MoneyPage';
import JournalPage from './pages/JournalPage';
import TravelPage from './pages/TravelPage';
import type { PageType } from './types';
import { formatDateCN } from './lib/utils';
import { ensureStorageReady, migrateFromLocalStorage } from './lib/storage';

function App() {
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [ready, setReady] = useState(false);

  // 初始化 Supabase 存储 + 迁移 localStorage
  useEffect(() => {
    (async () => {
      await ensureStorageReady();
      await migrateFromLocalStorage();
      setReady(true);
    })();
  }, []);

  // Set hero date
  useEffect(() => {
    const el = document.getElementById('heroDateText');
    if (el) {
      const now = new Date();
      const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const weeks = ['日', '一', '二', '三', '四', '五', '六'];
      const cn = `${now.getMonth() + 1}月${now.getDate()}日 周${weeks[now.getDay()]} · ${now.getFullYear()}`;
      el.textContent = cn;
    }
  }, []);

  if (!ready) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui', color: '#666' }}>
        Loading...
      </div>
    );
  }

  return (
    <Layout activePage={activePage} onPageChange={setActivePage}>
      {activePage === 'dashboard' && <DashboardPage />}
      {activePage === 'reflect' && <ReflectPage />}
      {activePage === 'goals' && <GoalsPage />}
      {activePage === 'library' && <LibraryPage />}
      {activePage === 'money' && <MoneyPage />}
      {activePage === 'journal' && <JournalPage />}
      {activePage === 'travel' && <TravelPage />}
    </Layout>
  );
}

export default App;
