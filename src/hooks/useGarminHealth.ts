import { useEffect, useState } from 'react';
import { supabase } from '../lib/storage';

// 健康数据快照的存储 key
const HEALTH_KEY = 'garmin_health';
const AI_KEY = 'garmin_ai_insight';

// AI 洞察数据结构（由 scripts/garmin_fetch.py 调 DeepSeek 生成）
export interface GarminAIInsight {
  generatedAt: string;
  generatedAtLabel: string;
  content: string;
  model?: string;
}

// 从 Supabase 读取的 garmin_health 数据形状（由 scripts/garmin_fetch.py 生成）
export interface GarminHealthData {
  generatedAt: string;
  generatedAtLabel: string;
  days: Array<{
    date: string;
    restingHR?: number;
    sleepH?: number;
    sleepScore?: number;
    deepPct?: number;
    remPct?: number;
    stress?: number;
    maxStress?: number;
    steps?: number;
    kcal?: number;
    distanceKm?: number;
  }>;
  activity: {
    week: { total: number; bytype: Record<string, { n: number; durMin: number; distKm: number; kcal: number; avgHR?: number | null }> };
    month: { total: number; bytype: Record<string, { n: number; durMin: number; distKm: number; kcal: number; avgHR?: number | null }> };
    total: { total: number; bytype: Record<string, { n: number; durMin: number; distKm: number; kcal: number; avgHR?: number | null }> };
  };
  runPace: Array<{ d: string; v: number }>;
  hrZone?: Array<{ z: string; v: number; c: string }>;
  fitnessAge?: number;
  chronoAge?: number;
  vo2max?: number | null;
  cycle: {
    periods?: string[];
    lastPeriod?: string;
    cycleLen?: number;
    cycleDay?: number;
    nextPeriod?: string;
    phase?: string;
  };
  symptoms: Array<{ name: string; count: number }>;
  symptomDays?: number;
  goals: Array<{ name: string; pct: number; note: string }>;
}

/**
 * 读取 Garmin 健康数据快照。
 * 优先读云端（Supabase 的 garmin_health key），失败则返回 null（调用方用本地兜底）。
 */
export function useGarminHealth(): GarminHealthData | null {
  const [data, setData] = useState<GarminHealthData | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase) return;
      try {
        const { data: rows, error } = await supabase
          .from('app_data')
          .select('value')
          .eq('key', HEALTH_KEY)
          .maybeSingle();

        if (error || !rows || !rows.value) {
          console.warn('garmin_health 云端数据不可用，使用本地兜底', error?.message);
          return;
        }
        const parsed = JSON.parse(rows.value) as GarminHealthData;
        if (!cancelled) setData(parsed);
      } catch (e) {
        console.warn('读取 garmin_health 失败', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return data;
}

/**
 * 读取 AI 洞察（DeepSeek 每天自动生成的交叉分析）。
 * 优先读云端 garmin_ai_insight，失败返回 null（调用方用本地规则文案兜底）。
 */
export function useGarminAIInsight(): GarminAIInsight | null {
  const [data, setData] = useState<GarminAIInsight | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase) return;
      try {
        const { data: rows, error } = await supabase
          .from('app_data')
          .select('value')
          .eq('key', AI_KEY)
          .maybeSingle();

        if (error || !rows || !rows.value) {
          console.warn('garmin_ai_insight 云端数据不可用', error?.message);
          return;
        }
        const parsed = JSON.parse(rows.value) as GarminAIInsight;
        if (!cancelled) setData(parsed);
      } catch (e) {
        console.warn('读取 garmin_ai_insight 失败', e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return data;
}
