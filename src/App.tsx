import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
import {
  ensureStorageReady, migrateFromLocalStorage,
  isPasswordSet, checkPassword, setPassword,
  setSession, hasSession, clearSession,
} from './lib/storage';

type AuthPhase = 'loading' | 'setup' | 'login' | 'authenticated';

function App() {
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [authPhase, setAuthPhase] = useState<AuthPhase>('loading');

  // 初始化：加载存储 + 检查登录状态
  useEffect(() => {
    (async () => {
      await ensureStorageReady();
      await migrateFromLocalStorage();

      if (hasSession()) {
        setAuthPhase('authenticated');
      } else if (isPasswordSet()) {
        setAuthPhase('login');
      } else {
        setAuthPhase('setup');
      }
    })();
  }, []);

  // 登录成功后设置 hero date
  useEffect(() => {
    if (authPhase !== 'authenticated') return;
    const el = document.getElementById('heroDateText');
    if (el) {
      const now = new Date();
      const weeks = ['日', '一', '二', '三', '四', '五', '六'];
      const cn = `${now.getMonth() + 1}月${now.getDate()}日 周${weeks[now.getDay()]} · ${now.getFullYear()}`;
      el.textContent = cn;
    }
  }, [authPhase]);

  // ---- Loading ----
  if (authPhase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F6F3' }}>
        <div className="text-center">
          <Lock className="w-8 h-8 mx-auto mb-3 animate-pulse" style={{ color: 'var(--accent)' }} />
          <p className="text-[14px]" style={{ color: 'var(--text-muted)', fontFamily: "'Inter', sans-serif" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ---- Auth Gate ----
  if (authPhase === 'setup' || authPhase === 'login') {
    return (
      <AuthGate
        isSetup={authPhase === 'setup'}
        onAuthenticated={() => setAuthPhase('authenticated')}
      />
    );
  }

  // ---- Main App ----
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

// ===== Auth Gate Component =====

function AuthGate({ isSetup, onAuthenticated }: { isSetup: boolean; onAuthenticated: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    if (isSetup) {
      if (password.length < 6) {
        setError('密码至少 6 位');
        return;
      }
      if (password !== confirmPassword) {
        setError('两次密码不一致');
        return;
      }
      setLoading(true);
      const result = await setPassword(password);
      setLoading(false);
      if (result.ok) {
        setSession();
        onAuthenticated();
      } else {
        setError(result.error || '设置密码失败，请重试');
      }
    } else {
      setLoading(true);
      const ok = await checkPassword(password);
      setLoading(false);
      if (ok) {
        setSession();
        onAuthenticated();
      } else {
        setError('密码错误');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F7F6F3' }}>
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(201,169,110,0.12)' }}
          >
            <Lock className="w-7 h-7" style={{ color: 'var(--accent)' }} />
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
              fontSize: '24px',
              fontWeight: 300,
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
            }}
          >
            Doris' Life OS
          </h1>
          <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
            {isSetup ? '首次使用，请设置一个访问密码' : '请输入密码以继续'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSetup ? '设置密码（至少 6 位）' : '输入密码'}
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-[14px] border outline-none transition-colors"
              style={{
                background: 'var(--bg-card)',
                borderColor: error ? 'var(--danger)' : 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isSetup && (
            <input
              type={showPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认密码"
              className="w-full px-4 py-3 rounded-xl text-[14px] border outline-none transition-colors"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          )}

          {error && (
            <p className="text-[12px] px-1" style={{ color: 'var(--danger)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-[14px] font-medium text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {loading ? (
              <span className="animate-pulse">处理中...</span>
            ) : (
              <>
                {isSetup ? '设置密码并进入' : '进入'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {!isSetup && (
          <button
            onClick={() => clearSession()}
            className="w-full mt-4 text-[11px] text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            忘记密码？
          </button>
        )}

        <p className="text-[10px] text-center mt-6" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          数据已加密存储在云端
        </p>
      </div>
    </div>
  );
}

export default App;
