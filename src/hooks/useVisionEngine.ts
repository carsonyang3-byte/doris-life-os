import { useState, useEffect, useCallback, useMemo } from 'react';
import { DISTANCE_DIMS_DEFAULT } from '../lib/constants';
import { getItem, setItem } from '../lib/storage';
import { useHabits } from './useHabits';
import { useJournal } from './useJournal';
import { useTodayData } from './useToday';
import { useGoals } from './useGoals';

// 多年度 Vision Distance 存储键
const getVisionKey = (year: number) => `life-os-vision-distance-${year}`;

// 规则引擎配置：每个 Vision Distance 维度的数据源映射
export const VISION_DIMENSION_SOURCES = [
  {
    dimension: '身体健康',
    dataSources: [
      { type: 'habits', keys: ['运动', '睡眠'], weight: 0.6 },
      { type: 'today', keys: ['awareness'], weight: 0.2 },
      { type: 'journal', keys: ['health'], weight: 0.2 },
    ],
    description: '基于运动、睡眠打卡和健康记录',
  },
  {
    dimension: '内在稳定',
    dataSources: [
      { type: 'habits', keys: ['冥想'], weight: 0.3 },
      { type: 'journal', keys: ['mood', 'stability'], weight: 0.4 },
      { type: 'today', keys: ['happy', 'awareness'], weight: 0.3 },
    ],
    description: '基于冥想打卡、情绪记录和觉察',
  },
  {
    dimension: '家庭关系',
    dataSources: [
      { type: 'journal', keys: ['family', 'relationship'], weight: 0.5 },
      { type: 'today', keys: ['happy'], weight: 0.3 },
      { type: 'habits', keys: ['沟通'], weight: 0.2 },
    ],
    description: '基于家庭记录、沟通打卡和快乐时刻',
  },
  {
    dimension: '财务自由',
    dataSources: [
      { type: 'goals', keys: ['financial'], weight: 0.4 },
      { type: 'habits', keys: ['理财'], weight: 0.3 },
      { type: 'journal', keys: ['finance'], weight: 0.3 },
    ],
    description: '基于财务目标进展、理财打卡和财务记录',
  },
  {
    dimension: '个人成长',
    dataSources: [
      { type: 'habits', keys: ['阅读', '学习'], weight: 0.5 },
      { type: 'journal', keys: ['growth', 'learning'], weight: 0.3 },
      { type: 'goals', keys: ['personal'], weight: 0.2 },
    ],
    description: '基于阅读学习打卡、成长记录和个人目标',
  },
  {
    dimension: '生活品质',
    dataSources: [
      { type: 'today', keys: ['tasks'], weight: 0.3 },
      { type: 'journal', keys: ['quality', 'enjoyment'], weight: 0.4 },
      { type: 'habits', keys: ['休闲'], weight: 0.3 },
    ],
    description: '基于任务完成、生活享受记录和休闲打卡',
  },
] as const;

// 计算单个维度的分数
function calculateDimensionScore(
  dimensionIndex: number,
  habitsData: any,
  journalData: any,
  todayData: any,
  goalsData: any
): { score: number; details: Array<{ source: string; value: number; weight: number }> } {
  const dimension = VISION_DIMENSION_SOURCES[dimensionIndex];
  if (!dimension) return { score: 0, details: [] };

  const details: Array<{ source: string; value: number; weight: number }> = [];
  let totalWeight = 0;
  let weightedSum = 0;

  dimension.dataSources.forEach(source => {
    let value = 0;
    
    switch (source.type) {
      case 'habits':
        // 计算习惯打卡完成率（过去30天）
        const habitCompletion = source.keys.reduce((sum, key) => {
          const habitData = habitsData[key as keyof typeof habitsData];
          if (!habitData || typeof habitData !== 'object') return sum;
          
          // 计算过去30天的完成率
          const last30Days = Object.entries(habitData)
            .filter(([date]) => {
              const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
              return daysAgo <= 30;
            })
            .map(([, completed]) => completed === true);
          
          const completionRate = last30Days.length > 0 
            ? last30Days.filter(Boolean).length / last30Days.length
            : 0;
          
          return sum + completionRate;
        }, 0);
        
        value = source.keys.length > 0 ? habitCompletion / source.keys.length : 0;
        break;

      case 'journal':
        // 计算相关日记记录数量（过去30天）
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const relevantEntries = journalData.filter((entry: any) => {
          if (entry.createdAt < thirtyDaysAgo) return false;
          const content = entry.content?.toLowerCase() || '';
          return source.keys.some(key => content.includes(key.toLowerCase()));
        });
        
        value = Math.min(relevantEntries.length / 10, 1); // 最多10篇算满分
        break;

      case 'today':
        // 计算Today页面数据
        if (source.keys.includes('tasks')) {
          // 任务完成率
          const completedTasks = (todayData.tasks || []).filter((task: string) => task.trim()).length;
          value = completedTasks / 3; // 3个任务
        } else if (source.keys.includes('happy')) {
          // 快乐指数（有记录就算有分）
          value = todayData.happy?.trim() ? 0.5 : 0;
        } else if (source.keys.includes('awareness')) {
          // 觉察记录
          value = todayData.awareness?.trim() ? 0.5 : 0;
        }
        break;

      case 'goals':
        // 计算相关目标完成率
        const relevantGoals = goalsData.filter((goal: any) => {
          const title = goal.title?.toLowerCase() || '';
          return source.keys.some(key => title.includes(key.toLowerCase()));
        });
        
        const goalProgress = relevantGoals.reduce((sum: number, goal: any) => {
          return sum + (goal.progress || 0);
        }, 0);
        
        value = relevantGoals.length > 0 ? goalProgress / (relevantGoals.length * 100) : 0;
        break;
    }

    const weightedValue = value * source.weight;
    details.push({
      source: `${source.type}:${source.keys.join(',')}`,
      value,
      weight: source.weight,
    });
    
    weightedSum += weightedValue;
    totalWeight += source.weight;
  });

  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return { score: Math.round(score * 100), details };
}

// 加载多年度 Vision Distance 数据
function loadVisionDistance(year: number) {
  try {
    const saved = getItem(getVisionKey(year));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length === DISTANCE_DIMS_DEFAULT.length) {
        return parsed;
      }
    }
  } catch {}
  
  // 返回默认值（全部为0）
  return [...DISTANCE_DIMS_DEFAULT];
}

// 保存多年度 Vision Distance 数据
function saveVisionDistance(year: number, data: typeof DISTANCE_DIMS_DEFAULT) {
  setItem(getVisionKey(year), JSON.stringify(data));
}

// 跨年迁移逻辑
function migrateYearData(sourceYear: number, targetYear: number): typeof DISTANCE_DIMS_DEFAULT {
  const sourceData = loadVisionDistance(sourceYear);
  const targetData = loadVisionDistance(targetYear);
  
  // 如果目标年份已有数据，不覆盖
  const hasTargetData = targetData.some(dim => dim.current > 0);
  if (hasTargetData) return targetData;
  
  // 迁移源年份数据（保留基础值，可以设置一个衰减系数）
  return sourceData.map(dim => ({
    ...dim,
    current: Math.round(dim.current * 0.8), // 新一年保留80%的进度
  }));
}

export function useVisionEngine() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [visionDistance, setVisionDistance] = useState(() => loadVisionDistance(year));
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState<Array<Array<{ source: string; value: number; weight: number }>>>([]);
  
  // 获取数据源
  const { getHabitData } = useHabits();
  const { meEntries, chenchenEntries } = useJournal();
  const { tasks, happy, awareness } = useTodayData();
  const { goals } = useGoals();

  // 获取所有可用的年份
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    
    // 添加当前年份
    years.add(currentYear);
    
    // 从存储中查找已有数据的年份
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      const data = loadVisionDistance(y);
      if (data.some(dim => dim.current > 0)) {
        years.add(y);
      }
    }
    
    return Array.from(years).sort((a, b) => b - a);
  }, []);

  // 切换年份
  const switchYear = useCallback((newYear: number) => {
    setYear(newYear);
    setVisionDistance(loadVisionDistance(newYear));
    setCalculationDetails([]);
  }, []);

  // 自动计算 Vision Distance
  const calculateVisionDistance = useCallback(() => {
    setIsCalculating(true);
    
    try {
      const habitsData = getHabitData();
      const journalData = [...meEntries, ...chenchenEntries];
      const todayData = { tasks, happy, awareness };
      const goalsData = goals;
      
      const newVisionDistance = [...visionDistance];
      const details: Array<Array<{ source: string; value: number; weight: number }>> = [];
      
      DISTANCE_DIMS_DEFAULT.forEach((_, index) => {
        const { score, details: dimDetails } = calculateDimensionScore(
          index,
          habitsData,
          journalData,
          todayData,
          goalsData
        );
        
        newVisionDistance[index] = {
          ...newVisionDistance[index],
          current: score,
        };
        
        details.push(dimDetails);
      });
      
      setVisionDistance(newVisionDistance);
      saveVisionDistance(year, newVisionDistance);
      setCalculationDetails(details);
      
      return newVisionDistance;
    } finally {
      setIsCalculating(false);
    }
  }, [getHabitData, meEntries, chenchenEntries, tasks, happy, awareness, goals, visionDistance, year]);

  // 手动更新某个维度
  const updateDimension = useCallback((index: number, value: number) => {
    setVisionDistance(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        current: Math.max(0, Math.min(100, value)),
      };
      saveVisionDistance(year, updated);
      return updated;
    });
  }, [year]);

  // 重置所有维度
  const resetVisionDistance = useCallback(() => {
    const defaultData = [...DISTANCE_DIMS_DEFAULT];
    setVisionDistance(defaultData);
    saveVisionDistance(year, defaultData);
    setCalculationDetails([]);
  }, [year]);

  // 执行跨年迁移
  const migrateToNewYear = useCallback((newYear: number) => {
    const migratedData = migrateYearData(year, newYear);
    setYear(newYear);
    setVisionDistance(migratedData);
    saveVisionDistance(newYear, migratedData);
    return migratedData;
  }, [year]);

  // 获取计算详情
  const getDimensionDetails = useCallback((index: number) => {
    if (calculationDetails.length > index) {
      return calculationDetails[index];
    }
    return [];
  }, [calculationDetails]);

  return {
    // 状态
    year,
    visionDistance,
    availableYears,
    isCalculating,
    
    // 操作
    switchYear,
    calculateVisionDistance,
    updateDimension,
    resetVisionDistance,
    migrateToNewYear,
    
    // 详情
    getDimensionDetails,
    
    // 工具函数
    loadVisionDistance: () => loadVisionDistance(year),
  };
}