import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SyncManager } from '@/components/SyncManager';
import { clearSession, getItem } from '@/lib/storage';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const [storageInfo, setStorageInfo] = useState({
    localStorageCount: 0,
    supabaseConfigured: false,
    lastSync: localStorage.getItem('last_sync_time') || '从未同步'
  });

  const refreshStorageInfo = useCallback(() => {
    const count = Object.keys(localStorage).filter(
      key => key.startsWith('life-os-') || key.startsWith('doris_')
    ).length;
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    const supabaseConfigured = !!(supabaseUrl && supabaseKey);
    
    setStorageInfo({
      localStorageCount: count,
      supabaseConfigured,
      lastSync: localStorage.getItem('last_sync_time') || '从未同步'
    });
  }, []);

  useEffect(() => {
    refreshStorageInfo();
    // 每5秒刷新一次，确保同步时间能及时更新
    const timer = setInterval(refreshStorageInfo, 5000);
    return () => clearInterval(timer);
  }, [refreshStorageInfo]);

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？退出后需要重新输入密码才能访问。')) {
      clearSession();
      window.location.reload();
    }
  };

  // 导出结构化分析数据
  const handleExportAnalysis = () => {
    try {
      const year = new Date().getFullYear();
      const exportData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        year,
      };

      // 1. 习惯打卡数据
      const habitsRaw = getItem('life-os-habits');
      if (habitsRaw) {
        const habitsData = JSON.parse(habitsRaw);
        // 转成 [{date, 冥想: true, 运动: false, ...}] 的扁平结构
        const habitList = JSON.parse(getItem('life-os-habit-list') || '["冥想","运动","阅读","早睡","喝水","反思"]');
        exportData.habits = Object.entries(habitsData)
          .filter(([date]) => date.startsWith(String(year)))
          .map(([date, habits]: [string, any]) => {
            const row: Record<string, any> = { date };
            habitList.forEach((h: string) => { row[h] = habits[h] ?? null; });
            return row;
          })
          .sort((a: any, b: any) => a.date.localeCompare(b.date));
      }

      // 2. 每日 Today 记录（三件事 + 开心小事 + 觉察）
      const todayRecords: any[] = [];
      for (let i = 0; i < 365; i++) {
        const d = new Date(year, 0, 1);
        d.setDate(d.getDate() + i);
        if (d.getFullYear() !== year) break;
        const dateStr = formatDate(d);
        const raw = getItem('life-os-today-' + dateStr);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            todayRecords.push({ date: dateStr, tasks: data.tasks, happy: data.happy, awareness: data.awareness });
          } catch {}
        }
      }
      if (todayRecords.length > 0) exportData.todayRecords = todayRecords;

      // 3. 反思/觉察记录
      const reflectRecords: any[] = [];
      for (let i = 0; i < 365; i++) {
        const d = new Date(year, 0, 1);
        d.setDate(d.getDate() + i);
        if (d.getFullYear() !== year) break;
        const dateStr = formatDate(d);
        const raw = getItem('life-os-reflect-daily-' + dateStr);
        if (raw) {
          try { reflectRecords.push({ date: dateStr, type: 'daily', ...JSON.parse(raw) }); } catch {}
        }
        const rawW = getItem('life-os-reflect-weekly-' + dateStr);
        if (rawW) {
          try { reflectRecords.push({ date: dateStr, type: 'weekly', ...JSON.parse(rawW) }); } catch {}
        }
      }
      if (reflectRecords.length > 0) exportData.reflections = reflectRecords;

      // 4. 日记
      const journalMeRaw = getItem('life-os-journal-me');
      if (journalMeRaw) {
        try {
          exportData.journalMe = JSON.parse(journalMeRaw).map((e: any) => ({
            date: e.date, title: e.title, content: e.content, mood: e.mood, tags: e.tags,
          }));
        } catch {}
      }

      // 5. 财务记录
      const moneyRaw = getItem('life-os-money');
      if (moneyRaw) {
        try {
          exportData.moneyRecords = JSON.parse(moneyRaw).map((r: any) => ({
            date: r.date, type: r.type, category: r.categoryLabel, amount: r.amount, note: r.note,
          }));
        } catch {}
      }

      // 6. 目标
      const goalsRaw = getItem('life-os-goals');
      if (goalsRaw) {
        try {
          exportData.goals = JSON.parse(goalsRaw).map((g: any) => ({
            title: g.title, progress: g.progress, year: g.year, autoCalc: g.autoCalc?.type || null,
          }));
        } catch {}
      }

      // 7. Vision Distance
      const visionRaw = getItem(`life-os-vision-distance-${year}`);
      if (visionRaw) {
        try {
          exportData.visionDistance = JSON.parse(visionRaw).map((d: any) => ({
            label: d.label, current: d.current,
          }));
        } catch {}
      }

      // 8. 图书/影音
      const libraryRaw = getItem('doris_library');
      if (libraryRaw) {
        try {
          exportData.library = JSON.parse(libraryRaw).map((i: any) => ({
            type: i.type, title: i.title, creator: i.creator, date: i.date, rating: i.rating, status: i.status, note: i.note,
          }));
        } catch {}
      }

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life-os-analysis-${year}-${formatDate(new Date())}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('导出失败：' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handleClearCache = () => {
    if (window.confirm('确定要清除本地缓存吗？云端数据不会受影响，但清除后需要重新从云端同步。')) {
      const keysToKeep = ['__auth_password__', 'last_sync_time'];
      const keysToRemove = Object.keys(localStorage).filter(
        key => (key.startsWith('life-os-') || key.startsWith('doris_')) && !keysToKeep.includes(key)
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      alert(`已清除 ${keysToRemove.length} 条本地缓存数据。页面将刷新以重新加载数据。`);
      window.location.reload();
    }
  };

  // 暴露给 SyncManager 的回调，同步完成后刷新状态
  (window as unknown as { __refreshSettings?: () => void }).__refreshSettings = refreshStorageInfo;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">设置</h1>
        <p className="text-gray-600">管理你的应用设置和数据同步</p>
      </div>

      {/* 云端同步卡片 */}
      <SyncManager />

      {/* 分析数据导出 */}
      <Card>
        <CardHeader>
          <CardTitle>数据分析导出</CardTitle>
          <CardDescription>
            导出结构化数据用于 AI 分析（如让 AI 帮你发现行为模式、情绪规律等）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            导出内容包含：习惯打卡、每日记录（三件事/觉察/开心小事）、反思记录、日记、财务、目标、Vision Distance、图书影音。
            数据格式为结构化 JSON，可直接粘贴给 ChatGPT / Claude 等进行分析。
          </p>
          <Button onClick={handleExportAnalysis} className="w-full sm:w-auto">
            导出 {new Date().getFullYear()} 年分析数据
          </Button>
        </CardContent>
      </Card>

      {/* 存储信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>存储状态</CardTitle>
          <CardDescription>查看本地和云端数据状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">本地数据</span>
                <span className="text-sm text-gray-600">{storageInfo.localStorageCount} 条</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">云端同步</span>
                <span className={`text-sm ${storageInfo.supabaseConfigured ? 'text-green-600' : 'text-yellow-600'}`}>
                  {storageInfo.supabaseConfigured ? '已配置' : '未配置'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">最后同步</span>
                <span className="text-sm text-gray-600">{storageInfo.lastSync}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm">
                <p className="font-medium mb-1">数据存储位置：</p>
                <ul className="list-disc pl-4 space-y-1 text-gray-600">
                  <li>本地：浏览器 localStorage</li>
                  <li>云端：Supabase 数据库</li>
                  <li>自动双向同步</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 开发者信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>开发者信息</CardTitle>
          <CardDescription>技术栈和项目信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-2">技术栈</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>React + TypeScript</li>
                <li>Vite + Tailwind CSS</li>
                <li>Radix UI 组件库</li>
                <li>Supabase 后端</li>
                <li>GitHub Pages 部署</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">项目信息</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>版本：Beta 1.1</li>
                <li>部署：https://carsonyang3-byte.github.io/doris-life-os/</li>
                <li>GitHub：carsonyang3-byte/doris-life-os</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 操作卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>账户操作</CardTitle>
          <CardDescription>管理你的账户和本地数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={handleClearCache}
              className="flex-1"
            >
              清除本地缓存
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="flex-1"
            >
              退出登录
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 pt-2 border-t">
            <p>提示：</p>
            <ul className="list-disc pl-4 mt-1 space-y-1">
              <li>清除缓存不会删除云端数据</li>
              <li>退出登录后需要重新输入密码</li>
              <li>所有操作都会立即生效</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 环境信息 */}
      <div className="text-xs text-gray-400 text-center pt-4">
        <p>Doris' Life OS v1.1 • 数据存储在云端 • 最后更新: 2026-04-05</p>
      </div>
    </div>
  );
}