import { useState, useEffect, useCallback, useMemo } from 'react';
import { DISTANCE_DIMS_DEFAULT } from '../lib/constants';
import { getItem, setItem } from '../lib/storage';
import { useHabits } from './useHabits';
import { useJournal } from './useJournal';
import { useTodayData } from './useToday';
import { useGoals } from './useGoals';

// 多年度 Vision Distance 存储键
const getVisionKey = (year: number) => `life-os-vision-distance-${year}`;

// 自定义维度存储键（跨年共享）
const CUSTOM_DIMS_KEY = 'life-os-vision-custom-dims';

// 预设颜色池
export const DIM_COLORS = ['#5BAD6F','#5B9BD5','#E8963F','#C9A96E','#9B8FD6','#D9534F','#7B68EE','#20B2AA','#FF6B6B','#4ECDC4'];

// 维度数据源配置类型
export interface DimensionSource {
  type: 'habits' | 'journal' | 'today' | 'goals';
  keys: string[];
  weight: number;
}

export interface VisionDimension {
  label: string;
  color: string;
  sources?: DimensionSource[];
  manualOverride?: boolean;  // 手动编辑过，自动计算时跳过
}

// 默认维度数据源映射
// 设计原则：习惯为主（每天打卡最可靠）> 每日反思 > 日记（不一定天天写）
// 关键词尽量丰富，覆盖用户实际会用到的各种表达方式
const DEFAULT_DIM_SOURCES: Record<string, DimensionSource[]> = {
  '身体健康': [
    { type: 'habits', keys: ['运动', '睡眠', '锻炼', '跑步', '走路', '健身', '重训', '有氧', '力量', '拉伸', '瑜伽', '游泳', '骑行', '早睡', '起床', '喝水'], weight: 0.55 },
    { type: 'today', keys: ['awareness', '身体', '健康', '运动', '锻炼', '跑步', '走路', '步数', '睡眠', '早睡', '起床', '精力', '疲劳', '酸痛', '体重', '饮食', '喝水', '咖啡', '糖', '碳水', '蛋白'], weight: 0.25 },
    { type: 'journal', keys: ['健康', '身体', '运动', '睡眠', '锻炼', '跑步', '健身', '体重', '饮食', '生病', '医生', '药', '医院', '体检', '血压', '心率', '疲惫', '精力', '状态', '养生'], weight: 0.2 },
  ],
  '内在稳定': [
    { type: 'habits', keys: ['冥想', '呼吸', '正念', '静坐', '打坐', '冥想'], weight: 0.4 },
    { type: 'today', keys: ['awareness', '情绪', '心情', '焦虑', '压力', '紧张', '放松', '平静', '烦躁', '低落', '开心', '愤怒', '恐惧', '担心', '不安', '内耗', '控制', '接纳', '觉察', '稳定', '心态', '平和', '崩溃', '恢复'], weight: 0.35 },
    { type: 'journal', keys: ['情绪', '心情', '焦虑', '压力', '紧张', '放松', '平静', '烦躁', '低落', '内耗', '控制', '接纳', '觉察', '冥想', '正念', '呼吸', '心态', '平和', '崩溃', '治愈', '调节', '心理', '精神', '状态'], weight: 0.25 },
  ],
  '家庭关系': [
    { type: 'habits', keys: ['沟通', '陪伴', '聊天', '散步', '亲子', '家庭', '通话', '视频'], weight: 0.4 },
    { type: 'today', keys: ['awareness', '家人', '孩子', '老公', '老公公', '婆婆', '父母', '爸爸', '妈妈', '儿子', '女儿', '家庭', '陪伴', '沟通', '争吵', '吵架', '关系', '温暖', '感谢', '爱', '照顾', '辅导', '作业', '接送', '做饭', '聚餐'], weight: 0.35 },
    { type: 'journal', keys: ['家人', '孩子', '老公', '儿子', '女儿', '父母', '爸爸', '妈妈', '家庭', '陪伴', '沟通', '关系', '争吵', '温暖', '感谢', '爱', '照顾', '辅导', '接送', '做菜', '做饭', '聚餐', '周末', '出游', '旅行', '亲子', '婆媳', '教育', '育儿'], weight: 0.25 },
  ],
  '财务自由': [
    { type: 'habits', keys: ['理财', '记账', '存钱', '预算', '投资', '储蓄', '复盘'], weight: 0.45 },
    { type: 'today', keys: ['awareness', '钱', '理财', '存钱', '花钱', '消费', '买', '收入', '工资', '投资', '股票', '基金', '存款', '储蓄', '账单', '还贷', '房贷', '保险', '退休', '财务', '省钱', '预算', '开销', '支出', '贵', '便宜', '划算', '浪费', '剁手'], weight: 0.3 },
    { type: 'journal', keys: ['钱', '理财', '存钱', '消费', '收入', '工资', '投资', '股票', '基金', '存款', '储蓄', '账单', '房贷', '保险', '财务', '省钱', '预算', '开销', '支出', '花费', '购物', '消费', '退休', '理财', '资产', '负债', '加薪', '奖金', '副业', '搞钱', '记账'], weight: 0.25 },
  ],
  '个人成长': [
    { type: 'habits', keys: ['阅读', '学习', '写作', '英语', '课程', '读书', '背单词', '听力', '口语', '编程', '笔记', '复盘', '总结'], weight: 0.5 },
    { type: 'today', keys: ['awareness', '成长', '学习', '读书', '阅读', '写作', '思考', '反思', '收获', '进步', '目标', '计划', '习惯', '改变', '提升', '突破', '技能', '知识', '课程', '笔记', '总结', '复盘', '领悟', '洞察', '认知', '思维'], weight: 0.3 },
    { type: 'journal', keys: ['成长', '学习', '读书', '阅读', '写作', '思考', '反思', '收获', '进步', '目标', '计划', '习惯', '改变', '提升', '突破', '技能', '知识', '课程', '笔记', '总结', '复盘', '领悟', '洞察', '认知', '思维', '书', '播客', '文章', '视频', '教程', '练习', '项目', '作品', '输出', '输入'], weight: 0.2 },
  ],
  '生活品质': [
    { type: 'habits', keys: ['休闲', '放松', '娱乐', '电影', '音乐', '园艺', '手工', '烹饪', '散步', '追剧', '画画', '摄影', '游戏'], weight: 0.4 },
    { type: 'today', keys: ['awareness', '开心', '快乐', '享受', '放松', '休闲', '舒服', '惬意', '美好', '幸福', '满足', '感恩', '生活', '品质', '休息', '放假', '周末', '假期', '旅游', '出门', '逛街', '美食', '咖啡', '电影', '音乐', '追剧', '游戏', '聚会', '朋友', '社交', '爱好', '兴趣'], weight: 0.35 },
    { type: 'journal', keys: ['生活', '品质', '享受', '开心', '快乐', '放松', '休闲', '舒服', '惬意', '美好', '幸福', '满足', '感恩', '休息', '度假', '旅游', '旅行', '出行', '逛街', '美食', '咖啡', '电影', '音乐', '追剧', '游戏', '聚会', '朋友', '社交', '爱好', '兴趣', '摄影', '花', '植物', '宠物', '布置', '装饰', '打扫', '整理'], weight: 0.25 },
  ],
};

// 获取自定义维度列表
function loadCustomDimensions(): VisionDimension[] {
  try {
    const saved = getItem(CUSTOM_DIMS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // 返回默认维度
  return DISTANCE_DIMS_DEFAULT.map(d => ({
    label: d.label,
    color: d.color,
    sources: DEFAULT_DIM_SOURCES[d.label] || [],
  }));
}

// 保存自定义维度列表
function saveCustomDimensions(dims: VisionDimension[]) {
  setItem(CUSTOM_DIMS_KEY, JSON.stringify(dims));
}

// 计算单个维度的分数
function calculateDimensionScore(
  dim: VisionDimension,
  habitsData: any,
  journalData: any,
  todayData: any,
  goalsData: any
): { score: number; details: Array<{ source: string; value: number; weight: number }> } {
  const sources = dim.sources || DEFAULT_DIM_SOURCES[dim.label] || [];
  if (sources.length === 0) return { score: 0, details: [] };

  const details: Array<{ source: string; value: number; weight: number }> = [];
  let totalWeight = 0;
  let weightedSum = 0;

  sources.forEach(source => {
    let value = 0;
    
    switch (source.type) {
      case 'habits':
        // 计算习惯打卡完成率（过去30天）
        // habitsData 结构: { "2026-04-08": { "重训": true, "有氧": false }, ... }
        // source.keys 可能是：
        //   - 用户手动映射的实际习惯名（如 ['重训', '有氧', '睡眠']）→ 精确匹配优先
        //   - 默认关键词（如 ['运动', '睡眠']）→ 模糊匹配 fallback
        if (!habitsData || typeof habitsData !== 'object') break;

        // 1. 收集用户实际的所有习惯名称（去重）— 用于判断 keys 是手动映射还是关键词
        const allHabitNames = new Set<string>();
        Object.values(habitsData).forEach((dayHabits: any) => {
          if (dayHabits && typeof dayHabits === 'object') {
            Object.keys(dayHabits).forEach(name => allHabitNames.add(name));
          }
        });

        // 2. 区分手动映射的习惯名 和 关键词
        const manualHabits: string[] = []; // 在实际数据中存在的 → 手动映射
        const keywords: string[] = [];     // 不在实际数据中的 → 模糊匹配用
        source.keys.forEach(key => {
          if (allHabitNames.has(key)) {
            manualHabits.push(key);  // 这个 key 就是用户的实际习惯名，精确匹配
          } else {
            keywords.push(key);      // 这是关键词，需要模糊匹配
          }
        });

        // 3. 收集所有要计算的习惯：手动的 + 模糊匹配到的（去重）
        const matchedSet = new Set<string>(manualHabits);

        // 对关键词做模糊匹配（补充手动没覆盖的）
        if (keywords.length > 0) {
          Array.from(allHabitNames)
            .filter(habitName => !matchedSet.has(habitName)) // 排除已经手动映射的
            .forEach(habitName => {
              const isMatch = keywords.some(keyword => {
                // 规则a: 互包含
                if (habitName.includes(keyword) || keyword.includes(habitName)) return true;
                // 规则b: 单字重叠（短字符串）
                const shorter = habitName.length <= keyword.length ? habitName : keyword;
                if (shorter.length <= 3) {
                  const longer = shorter === habitName ? keyword : habitName;
                  return [...shorter].some(char => longer.includes(char));
                }
                return false;
              });
              if (isMatch) matchedSet.add(habitName);
            });
        }

        const finalHabits = Array.from(matchedSet);
        if (finalHabits.length === 0) break; // 没有相关习惯

        // 4. 计算过去30天的完成率
        const last30Days = Object.entries(habitsData)
          .filter(([dateStr]) => {
            const daysAgo = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
            return daysAgo >= 0 && daysAgo <= 30;
          });

        if (last30Days.length === 0) break;

        // 每个习惯独立算完成率，再取平均
        const habitRates = finalHabits.map(habitName => {
          const completed = last30Days.filter(([, habitsForDate]) => {
            return habitsForDate && typeof habitsForDate === 'object' && habitsForDate[habitName] === true;
          }).length;
          return completed / last30Days.length;
        });

        value = habitRates.reduce((s, r) => s + r, 0) / habitRates.length;
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
          // 觉察记录：优先用关键词匹配（更精确），无匹配则 fallback 到"有内容就得分"
          const awarenessText = todayData.awareness?.trim()?.toLowerCase() || '';
          if (awarenessText) {
            // 过滤掉特殊标记 keys（tasks/happy/awareness），剩下的才是真正的搜索关键词
            const searchKeys = source.keys.filter(k => !['tasks', 'happy', 'awareness'].includes(k));
            if (searchKeys.length > 0) {
              const matchCount = searchKeys.filter(key => awarenessText.includes(key.toLowerCase())).length;
              value = Math.min(matchCount / searchKeys.length, 1); // 命中比例作为分数
            } else {
              value = 0.5; // 无搜索关键词但有内容，给基础分
            }
          } else {
            value = 0;
          }
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

// 加载多年度 Vision Distance 数据（灵活适配维度数量）
function loadVisionDistance(year: number, dims?: VisionDimension[]) {
  const defaultDims = dims || DISTANCE_DIMS_DEFAULT.map(d => ({ label: d.label, color: d.color, current: 0 }));
  
  try {
    const saved = getItem(getVisionKey(year));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 用 customDimensions 的长度和标签来适配已保存的数据
        return defaultDims.map((def, i) => {
          if (i < parsed.length) {
            return { ...def, current: parsed[i].current ?? 0 };
          }
          return def;
        });
      }
    }
  } catch {}
  
  // 返回默认值（全部为0）
  return defaultDims.map(d => ({ ...d }));
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
  const [customDimensions, setCustomDimensions] = useState<VisionDimension[]>(() => loadCustomDimensions());
  const [visionDistance, setVisionDistance] = useState<typeof DISTANCE_DIMS_DEFAULT>(() => {
    // 用 customDimensions 初始化，确保长度一致
    const dims = loadCustomDimensions();
    return loadVisionDistance(new Date().getFullYear(), dims);
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationDetails, setCalculationDetails] = useState<Array<Array<{ source: string; value: number; weight: number }>>>([]);
  
  // 获取数据源
  const { data: habitsData } = useHabits();
  const { meEntries, chenchenEntries } = useJournal();
  const { tasks, happy, awareness } = useTodayData();
  const { goals } = useGoals();

  // 确保维度数量和 visionDistance 对齐（当自定义维度变化时）
  useEffect(() => {
    setVisionDistance(prev => {
      // 如果维度数量变了，需要调整 visionDistance 数组长度
      if (prev.length !== customDimensions.length) {
        const aligned: typeof prev = [];
        customDimensions.forEach((dim, i) => {
          if (i < prev.length) {
            aligned.push({ ...prev[i], label: dim.label, color: dim.color });
          } else {
            aligned.push({ label: dim.label, color: dim.color, current: 0 });
          }
        });
        return aligned;
      }
      // 更新label和color以保持同步
      return prev.map((v, i) => ({
        ...v,
        label: customDimensions[i]?.label ?? v.label,
        color: customDimensions[i]?.color ?? v.color,
      }));
    });
  }, [customDimensions]);

  // 获取所有可用的年份
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    
    years.add(currentYear);
    
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      const data = loadVisionDistance(y);
      if (data.some(dim => dim.current > 0)) {
        years.add(y);
      }
    }
    
    return Array.from(years).sort((a, b) => b - a);
  }, [visionDistance]);

  // 切换年份
  const switchYear = useCallback((newYear: number) => {
    setYear(newYear);
    setVisionDistance(loadVisionDistance(newYear, customDimensions));
    setCalculationDetails([]);
  }, [customDimensions]);

  // 添加维度
  const addDimension = useCallback((label: string, color?: string, sources?: DimensionSource[]) => {
    setCustomDimensions(prev => {
      const nextColor = color || DIM_COLORS[prev.length % DIM_COLORS.length];
      const newDims = [...prev, { 
        label, 
        color: nextColor,
        sources: sources || [],
      }];
      saveCustomDimensions(newDims);
      return newDims;
    });
  }, []);

  // 删除维度
  const removeDimension = useCallback((index: number) => {
    setCustomDimensions(prev => {
      const newDims = prev.filter((_, i) => i !== index);
      saveCustomDimensions(newDims);
      return newDims;
    });
    // 同时清理该维度的 distance 数据
    setVisionDistance(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 更新维度的数据源配置
  const updateDimensionSources = useCallback((index: number, sources: DimensionSource[]) => {
    setCustomDimensions(prev => {
      const newDims = [...prev];
      newDims[index] = { ...newDims[index], sources };
      saveCustomDimensions(newDims);
      return newDims;
    });
  }, []);

  // 自动计算 Vision Distance
  const calculateVisionDistance = useCallback(() => {
    setIsCalculating(true);
    
    try {
      const journalData = [...meEntries, ...chenchenEntries];
      const todayData = { tasks, happy, awareness };
      const goalsData = goals;
      
      const details: Array<Array<{ source: string; value: number; weight: number }>> = [];
      
      // 直接基于 customDimensions 构建新结果，不依赖闭包中的 visionDistance
      const newVisionDistance = customDimensions.map((dim, index) => {
        // 跳过手动覆盖的维度，保留原值
        if (dim.manualOverride) {
          details.push([]);
          return {
            label: dim.label,
            color: dim.color,
            current: visionDistance[index]?.current ?? 0,
          };
        }
        const { score, details: dimDetails } = calculateDimensionScore(
          dim,
          habitsData,
          journalData,
          todayData,
          goalsData
        );
        
        details.push(dimDetails);
        
        return {
          label: dim.label,
          color: dim.color,
          current: score,
        };
      });
      
      setVisionDistance(newVisionDistance);
      saveVisionDistance(year, newVisionDistance);
      setCalculationDetails(details);
      
      return newVisionDistance;
    } finally {
      setIsCalculating(false);
    }
  }, [habitsData, meEntries, chenchenEntries, tasks, happy, awareness, goals, year, customDimensions]);

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
    // 标记该维度为手动覆盖
    setCustomDimensions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], manualOverride: true };
      saveCustomDimensions(next);
      return next;
    });
  }, [year]);

  // 重置所有维度
  const resetVisionDistance = useCallback(() => {
    const defaultData = customDimensions.map(d => ({ label: d.label, color: d.color, current: 0 }));
    setVisionDistance(defaultData);
    saveVisionDistance(year, defaultData);
    setCalculationDetails([]);
    // 清除所有手动覆盖标记
    setCustomDimensions(prev => {
      const next = prev.map(d => ({ ...d, manualOverride: false }));
      saveCustomDimensions(next);
      return next;
    });
  }, [year, customDimensions]);

  // 恢复某个维度的自动计算
  const resetDimensionToAuto = useCallback((index: number) => {
    setCustomDimensions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], manualOverride: false };
      saveCustomDimensions(next);
      return next;
    });
  }, []);

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
    customDimensions,
    availableYears,
    isCalculating,
    
    // 操作
    switchYear,
    calculateVisionDistance,
    addDimension,
    removeDimension,
    updateDimensionSources,
    updateDimension,
    resetVisionDistance,
    resetDimensionToAuto,
    migrateToNewYear,
    
    // 详情
    getDimensionDetails,
    
    // 工具函数
    loadVisionDistance: () => loadVisionDistance(year, customDimensions),
  };
}