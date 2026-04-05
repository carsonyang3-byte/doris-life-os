import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SyncManager } from '@/components/SyncManager';
import { clearSession } from '@/lib/storage';

export default function SettingsPage() {
  const [storageInfo, setStorageInfo] = useState({
    localStorageCount: 0,
    supabaseConfigured: false,
    lastSync: localStorage.getItem('last_sync_time') || '从未同步'
  });

  useEffect(() => {
    // 计算本地存储数据量
    const count = Object.keys(localStorage).filter(
      key => key.startsWith('life-os-') || key.startsWith('doris_')
    ).length;
    
    // 检查 Supabase 是否配置
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
    const supabaseConfigured = !!(supabaseUrl && supabaseKey);
    
    setStorageInfo({
      localStorageCount: count,
      supabaseConfigured,
      lastSync: localStorage.getItem('last_sync_time') || '从未同步'
    });
  }, []);

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？退出后需要重新输入密码才能访问。')) {
      clearSession();
      window.location.reload();
    }
  };

  const handleClearCache = () => {
    if (window.confirm('确定要清除本地缓存吗？云端数据不会受影响，但清除后需要重新从云端同步。')) {
      // 只清除应用相关数据，保留密码等
      const keysToKeep = ['__auth_password__', 'last_sync_time'];
      const keysToRemove = Object.keys(localStorage).filter(
        key => (key.startsWith('life-os-') || key.startsWith('doris_')) && !keysToKeep.includes(key)
      );
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      alert(`已清除 ${keysToRemove.length} 条本地缓存数据。页面将刷新以重新加载数据。`);
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">设置</h1>
        <p className="text-gray-600">管理你的应用设置和数据同步</p>
      </div>

      {/* 云端同步卡片 */}
      <SyncManager />

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