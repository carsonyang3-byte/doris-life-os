import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { refreshFromCloud, exportAllData, importData } from '@/lib/storage';

interface SyncStatus {
  lastSync: string | null;
  totalItems: number;
  isSyncing: boolean;
  error: string | null;
}

export function SyncManager() {
  const [status, setStatus] = useState<SyncStatus>({
    lastSync: localStorage.getItem('last_sync_time') || null,
    totalItems: 0,
    isSyncing: false,
    error: null
  });
  const [importDataText, setImportDataText] = useState('');

  // 计算本地数据数量
  useEffect(() => {
    const count = Object.keys(localStorage).filter(
      key => key.startsWith('life-os-') || key.startsWith('doris_')
    ).length;
    setStatus(prev => ({ ...prev, totalItems: count }));
  }, []);

  const handleSyncNow = async () => {
    setStatus(prev => ({ ...prev, isSyncing: true, error: null }));
    try {
      await refreshFromCloud();
      const now = new Date().toLocaleString('zh-CN');
      localStorage.setItem('last_sync_time', now);
      setStatus(prev => ({ 
        ...prev, 
        lastSync: now,
        isSyncing: false 
      }));
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '同步失败',
        isSyncing: false 
      }));
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `life-os-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '导出失败'
      }));
    }
  };

  const handleImport = async () => {
    if (!importDataText.trim()) {
      setStatus(prev => ({ ...prev, error: '请输入有效的JSON数据' }));
      return;
    }

    try {
      const data = JSON.parse(importDataText);
      if (typeof data !== 'object' || data === null) {
        throw new Error('无效的数据格式');
      }

      const imported = await importData(data);
      setStatus(prev => ({ 
        ...prev, 
        error: null 
      }));
      alert(`成功导入 ${imported} 条数据`);
      setImportDataText('');
      
      // 自动同步到云端
      await handleSyncNow();
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : '导入失败，请检查JSON格式'
      }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>云端同步</CardTitle>
        <CardDescription>
          在不同设备间自动同步你的数据
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">同步状态</span>
            <span className={`text-sm ${status.lastSync ? 'text-green-600' : 'text-gray-500'}`}>
              {status.lastSync ? `最后同步: ${status.lastSync}` : '尚未同步'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">本地数据</span>
            <span className="text-sm text-gray-600">{status.totalItems} 条</span>
          </div>
        </div>

        {status.error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{status.error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleSyncNow} 
            disabled={status.isSyncing}
            className="flex-1"
          >
            {status.isSyncing ? '同步中...' : '立即同步'}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="flex-1"
          >
            导出备份
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">
              从备份导入 (JSON格式)
            </label>
            <textarea
              value={importDataText}
              onChange={(e) => setImportDataText(e.target.value)}
              placeholder='粘贴你的备份JSON数据...'
              className="w-full h-32 p-3 border rounded-md text-sm font-mono"
              rows={4}
            />
          </div>
          <Button 
            variant="secondary" 
            onClick={handleImport}
            className="w-full"
          >
            导入备份
          </Button>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>提示：</p>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>同步需要网络连接</li>
            <li>建议定期导出备份以防止数据丢失</li>
            <li>导入数据会覆盖同名的现有数据</li>
            <li>数据会自动在设备间同步</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}