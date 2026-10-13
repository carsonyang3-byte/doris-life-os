import {
  useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import {
  Plus, Search, Trash2, ExternalLink, Check, X, Copy, Pencil,
  ShoppingCart, Calendar, RotateCcw, Download, AlertTriangle, CornerDownLeft,
  ChevronLeft, ChevronRight, Move, BarChart3, UtensilsCrossed, Beef, Palette,
  Carrot, Globe, Repeat, Camera,
} from 'lucide-react';
import type {
  Recipe, RecipePlatform, RecipeStatus, MainIngredient, ProteinTier,
} from '../types';
import {
  useKitchen, PLATFORM_LABEL, MAIN_INGREDIENT_LABEL, MAIN_INGREDIENT_ORDER,
  PROTEIN_TIER_LABEL, defaultTierOf, detectPlatform,
} from '../hooks/useKitchen';
import { toDateStr, getWeekStart } from '../lib/mealPlan';
import { computeStats, planDateRange } from '../lib/kitchenStats';
import { supabase } from '../lib/storage';

const SERIF = "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif";

/** 菜谱库没筛选时先铺多少张卡 —— 免得一进页面就是 135 张，太难看 */
const RECIPE_PREVIEW_COUNT = 8;

const STATUS_LABEL: Record<RecipeStatus, string> = {
  want: '想做',
  cooked: '做过',
  never: '别再提',
};

const STATUS_COLOR: Record<RecipeStatus, string> = {
  want: 'var(--accent)',
  cooked: '#6E8B5A',
  never: '#B4A08C',
};

/** 历史菜谱没有视频链接 —— 点了去 YouTube 搜这道菜 */
export const youtubeSearchUrl = (title: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`;

/** 菜单里一道菜的跳转目标：视频收藏 → 原视频；历史菜谱 → YouTube 搜索 */
export const dishLink = (r: Recipe): string => r.url || youtubeSearchUrl(r.title);

/** 鼠标悬停时的说明文案，区分"这是它自己的视频"和"这是搜索" */
export const dishLinkHint = (r: Recipe): string =>
  r.url ? `看视频（${PLATFORM_LABEL[r.platform]}）` : `YouTube 搜索「${r.title}」`;

type Tab = 'recipes' | 'plan' | 'shopping' | 'stats';

export default function KitchenPage() {
  const K = useKitchen();
  const [tab, setTab] = useState<Tab>('recipes');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'recipes', label: '菜谱库', count: K.stats.total },
    { key: 'plan', label: '本周菜单', count: K.stats.planned },
    { key: 'shopping', label: '采购清单', count: K.shoppingList.length },
    { key: 'stats', label: '统计', count: 0 },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 顶部：标题 + 统计 */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 style={{ fontFamily: SERIF, fontSize: '22px', fontWeight: 400, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            我的厨房
          </h2>
          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            共 {K.stats.total} 道菜 · 想做 {K.stats.want} · 做过 {K.stats.cooked} · 本周已排 {K.stats.planned}
          </p>
        </div>
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(201,169,110,0.08)' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer border-none"
              style={{
                background: tab === t.key ? 'var(--bg-card)' : 'transparent',
                color: tab === t.key ? 'var(--accent-dark)' : 'var(--text-muted)',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
              }}
            >
              {t.label}
              {t.count > 0 && <span className="ml-1.5 opacity-60">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {tab === 'recipes' && <RecipeLibrary K={K} />}
      {tab === 'plan' && <WeekPlan K={K} />}
      {tab === 'shopping' && <ShoppingList K={K} />}
      {tab === 'stats' && <StatsPanel K={K} />}
    </div>
  );
}

type Kitchen = ReturnType<typeof useKitchen>;

/* ============ 菜谱库 ============ */

/**
 * 把用户上传的图片统一压缩成 JPEG base64。
 * 解决两个问题：
 * 1. 手机可能选 HEIC/HEIF/WebP，DeepSeek 不一定认
 * 2. 原图可能太大，压缩到最大 1024 宽后请求体小很多
 */
function compressImageToBase64(file: File, maxWidth = 1024, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('浏览器不支持 canvas'));
        return;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败'));
    };
    img.src = url;
  });
}

function RecipeLibrary({ K }: { K: Kitchen }) {
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState<RecipePlatform | 'all'>('all');
  const [main, setMain] = useState<MainIngredient | 'all'>('all');
  const [cuisine, setCuisine] = useState<string>('all');
  const [status, setStatus] = useState<RecipeStatus | 'all'>('all');
  const [tag, setTag] = useState<string>('all');
  const [videoFilter, setVideoFilter] = useState<'all' | 'video'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importMsg, setImportMsg] = useState('');
  const [addMsg, setAddMsg] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [previewList, setPreviewList] = useState<Omit<Recipe, 'id' | 'createdAt'>[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotMsg, setScreenshotMsg] = useState('');
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  /** 批量删除：勾中的菜谱 id */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** 是否点了「查看全部」—— 没筛选时默认只铺一小段 */
  const [showAllRecipes, setShowAllRecipes] = useState(false);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return K.recipes.filter((r) => {
      if (platform !== 'all' && r.platform !== platform) return false;
      if (videoFilter === 'video' && !r.url) return false;
      if (main !== 'all' && r.mainIngredient !== main) return false;
      if (cuisine !== 'all' && (r.cuisine || '').trim() !== cuisine) return false;
      if (status !== 'all' && r.status !== status) return false;
      if (tag !== 'all' && !(r.tags || []).includes(tag)) return false;
      if (!kw) return true;
      return (
        r.title.toLowerCase().includes(kw) ||
        (r.cuisine || '').toLowerCase().includes(kw) ||
        (r.note || '').toLowerCase().includes(kw) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(kw)) ||
        r.ingredients.some((i) => i.toLowerCase().includes(kw))
      );
    });
  }, [K.recipes, keyword, platform, videoFilter, main, cuisine, status, tag]);

  const usedPlatforms = useMemo(() => {
    const s = new Set<RecipePlatform>();
    K.recipes.forEach((r) => s.add(r.platform));
    return Array.from(s);
  }, [K.recipes]);

  const usedMains = useMemo(
    () => MAIN_INGREDIENT_ORDER.filter((m) => K.recipes.some((r) => r.mainIngredient === m)),
    [K.recipes]
  );

  const usedCuisines = useMemo(() => {
    const c = new Map<string, number>();
    K.recipes.forEach((r) => {
      const k = (r.cuisine || '').trim();
      if (k) c.set(k, (c.get(k) || 0) + 1);
    });
    return Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
  }, [K.recipes]);

  const usedTags = useMemo(() => {
    const c = new Map<string, number>();
    K.recipes.forEach((r) => (r.tags || []).forEach((t) => c.set(t, (c.get(t) || 0) + 1)));
    return Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
  }, [K.recipes]);

  const resetFilters = () => {
    setKeyword('');
    setPlatform('all');
    setVideoFilter('all');
    setMain('all');
    setCuisine('all');
    setStatus('all');
    setTag('all');
  };

  const hasFilter = platform !== 'all' || videoFilter !== 'all' || main !== 'all' || cuisine !== 'all' || status !== 'all' || tag !== 'all' || !!keyword.trim();

  /**
   * 实际铺出来的列表：没筛选、也没点「查看全部」时，只铺前几道。
   * 免得一进菜谱库就是 135 张卡（用户 2026-10-03 提的）。
   */
  const visible = hasFilter || showAllRecipes ? filtered : filtered.slice(0, RECIPE_PREVIEW_COUNT);

  const handleImportLegacy = () => {
    const n = K.importLegacyRecipes();
    setImportMsg(n > 0 ? `已导入 ${n} 道历史菜谱` : '历史菜谱已全部在库里');
    setTimeout(() => setImportMsg(''), 3000);
  };

  const handleAdd = async () => {
    const lines = draft
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = lines
      .map((line) => {
        const urlMatch = line.match(/https?:\/\/\S+/);
        if (!urlMatch) return null;
        const url = urlMatch[0];
        const title = line.replace(url, '').replace(/[|\-—,，\s]+$/, '').trim();
        return { title: title || '', url };
      })
      .filter((x): x is { title: string; url: string } => !!x);

    if (parsed.length === 0) return;
    setAddLoading(true);
    try {
      const previews = await K.previewRecipesByLinks(parsed);
      if (previews.length === 0) {
        setAddMsg('这些链接都已经在库里了');
      } else {
        setPreviewList(previews);
        setShowPreview(true);
        setDraft('');
        setShowAdd(false);
      }
    } catch (e) {
      setAddMsg('读取失败，请重试');
    } finally {
      setAddLoading(false);
      setTimeout(() => setAddMsg(''), 3000);
    }
  };

  const handleSavePreviews = () => {
    const n = K.addRecipePreviews(previewList);
    setAddMsg(`已添加 ${n} 条菜谱`);
    setShowPreview(false);
    setPreviewList([]);
    setTimeout(() => setAddMsg(''), 3000);
  };

  const updatePreview = (idx: number, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => {
    setPreviewList((prev) => prev.map((p, i) => (i === idx ? { ...p, ...updates } : p)));
  };

  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScreenshotMsg('请选择图片文件');
      setTimeout(() => setScreenshotMsg(''), 3000);
      return;
    }
    if (!supabase) {
      setScreenshotMsg('Supabase 未配置，无法调用截图识别');
      setTimeout(() => setScreenshotMsg(''), 3000);
      return;
    }

    setScreenshotLoading(true);
    setScreenshotMsg('');
    try {
      const base64 = await compressImageToBase64(file);

      const { data, error } = await supabase.functions.invoke('parse-xiaohongshu', {
        body: { imageBase64: base64 },
      });

      if (error) {
        throw error;
      }

      const parsed = data as {
        title?: string;
        ingredients?: string[];
        mainIngredient?: string;
        proteinTier?: 'main' | 'semi' | 'veg';
        cuisine?: string;
        tags?: string[];
        confidence?: number;
        error?: string;
      };

      if (parsed.error) {
        throw new Error(parsed.error);
      }

      if (!parsed.title || parsed.title === '无法识别') {
        setScreenshotMsg('没能从这张图里识别出菜谱，换一张试试');
        setScreenshotLoading(false);
        if (screenshotInputRef.current) screenshotInputRef.current.value = '';
        setTimeout(() => setScreenshotMsg(''), 3000);
        return;
      }

      const main: MainIngredient = (parsed.mainIngredient as MainIngredient) || 'other';
      const preview: Omit<Recipe, 'id' | 'createdAt'> = {
        title: parsed.title,
        url: '',
        platform: 'legacy',
        ingredients: parsed.ingredients || [],
        mainIngredient: main,
        proteinTier: parsed.proteinTier || defaultTierOf(main),
        cuisine: parsed.cuisine || '',
        tags: parsed.tags || [],
        status: 'want',
        source: 'legacy',
      };

      setPreviewList([preview]);
      setShowPreview(true);
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
    } catch (err: any) {
      console.error('截图识别失败:', err);
      setScreenshotMsg(`识别失败：${err.message || '请重试'}`);
      setTimeout(() => setScreenshotMsg(''), 5000);
    } finally {
      setScreenshotLoading(false);
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
    }
  };

  /** 勾中 / 取消勾中一道菜（批量删除用） */
  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  /** 勾中的菜 —— 删之前摊开给你看一眼 */
  const selectedRecipes = useMemo(
    () => K.recipes.filter((r) => selected.has(r.id)),
    [K.recipes, selected]
  );

  const doDeleteSelected = () => {
    const n = K.deleteRecipes(Array.from(selected));
    setSelected(new Set());
    setConfirmDelete(false);
    setImportMsg(`已删除 ${n} 道`);
    setTimeout(() => setImportMsg(''), 3000);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 工具栏 */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜菜名、菜系、食材…"
              className="w-full pl-8 pr-3 py-2 rounded-xl text-[12px] border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={13} />
            收视频
          </button>
          <button
            onClick={() => screenshotInputRef.current?.click()}
            disabled={screenshotLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none disabled:opacity-60"
            style={{ background: '#6E8B5A' }}
          >
            <Camera size={13} />
            {screenshotLoading ? '识别中…' : '截图加菜'}
          </button>
          <input
            ref={screenshotInputRef}
            type="file"
            accept="image/*"
            onChange={handleScreenshot}
            className="hidden"
          />
          <button
            onClick={handleImportLegacy}
            title="把历史菜谱（135 道）导进菜谱库，按菜名去重"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] cursor-pointer"
            style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <Download size={13} />
            导入历史菜谱
          </button>
        </div>

        {K.recipes.length > 0 && (
          <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid var(--border)' }}>
            <FilterRow title="平台">
              <Chip active={platform === 'all'} onClick={() => setPlatform('all')} label={`全部 ${K.recipes.length}`} />
              {usedPlatforms.map((p) => (
                <Chip
                  key={p}
                  active={platform === p}
                  onClick={() => setPlatform(p)}
                  label={`${PLATFORM_LABEL[p]} ${K.recipes.filter((r) => r.platform === p).length}`}
                />
              ))}
            </FilterRow>

            <FilterRow title="视频">
              <Chip active={videoFilter === 'all'} onClick={() => setVideoFilter('all')} label="全部" />
              <Chip
                active={videoFilter === 'video'}
                onClick={() => setVideoFilter('video')}
                label={`有视频 ${K.recipes.filter((r) => !!r.url).length}`}
              />
            </FilterRow>

            {usedMains.length > 0 && (
              <FilterRow title="主料">
                <Chip active={main === 'all'} onClick={() => setMain('all')} label="全部" />
                {usedMains.map((m) => (
                  <Chip
                    key={m}
                    active={main === m}
                    onClick={() => setMain(m)}
                    label={`${MAIN_INGREDIENT_LABEL[m]} ${K.recipes.filter((r) => r.mainIngredient === m).length}`}
                  />
                ))}
              </FilterRow>
            )}

            {usedCuisines.length > 0 && (
              <FilterRow title="菜系">
                <Chip active={cuisine === 'all'} onClick={() => setCuisine('all')} label="全部" />
                {usedCuisines.map(([c, n]) => (
                  <Chip key={c} active={cuisine === c} onClick={() => setCuisine(c)} label={`${c} ${n}`} />
                ))}
              </FilterRow>
            )}

            <FilterRow title="状态">
              <Chip active={status === 'all'} onClick={() => setStatus('all')} label="全部" />
              {(['want', 'cooked', 'never'] as RecipeStatus[]).map((s) => (
                <Chip
                  key={s}
                  active={status === s}
                  onClick={() => setStatus(s)}
                  label={`${STATUS_LABEL[s]} ${K.recipes.filter((r) => r.status === s).length}`}
                />
              ))}
            </FilterRow>

            {usedTags.length > 0 && (
              <FilterRow title="标签">
                <Chip active={tag === 'all'} onClick={() => setTag('all')} label="全部" />
                {usedTags.map(([t, n]) => (
                  <Chip key={t} active={tag === t} onClick={() => setTag(t)} label={`${t} ${n}`} />
                ))}
              </FilterRow>
            )}

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {hasFilter
                  ? `筛出 ${filtered.length} / ${K.recipes.length} 道`
                  : `共 ${K.recipes.length} 道`}
              </span>
              {hasFilter && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] cursor-pointer border-none bg-transparent"
                  style={{ color: 'var(--accent-dark)' }}
                >
                  清空筛选
                </button>
              )}
            </div>
          </div>
        )}

        {selected.size > 0 && (
          <div
            className="mt-3 px-3 py-2 rounded-xl flex items-center justify-between gap-2 flex-wrap"
            style={{ background: 'rgba(201,169,110,0.10)' }}
          >
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              已勾选 {selected.size} 道
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer border-none"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
              >
                取消勾选
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white cursor-pointer border-none"
                style={{ background: 'var(--danger)' }}
              >
                <Trash2 size={11} />
                删除勾选的
              </button>
            </div>
          </div>
        )}

        {importMsg && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--accent-dark)' }}>{importMsg}</p>
        )}
        {screenshotMsg && (
          <p className="text-[11px] mt-2" style={{ color: '#6E8B5A' }}>{screenshotMsg}</p>
        )}

        {showAdd && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              每行一条，可直接粘链接；也可以写成「菜名 链接」。YouTube 会先读标题，下一步让你确认。
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder={'红烧肉 https://www.bilibili.com/video/BV1xx\nhttps://www.xiaohongshu.com/explore/xxx'}
              className="w-full px-3 py-2 rounded-xl text-[12px] border outline-none resize-y"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
            />
            {addMsg && (
              <p className="text-[11px] mt-2" style={{ color: 'var(--accent-dark)' }}>{addMsg}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAdd}
                disabled={addLoading}
                className="px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none disabled:opacity-60"
                style={{ background: 'var(--accent)' }}
              >
                {addLoading ? '读取中…' : '下一步：预览'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setDraft(''); setAddMsg(''); }}
                className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer border-none"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 预览/修正弹窗 */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setShowPreview(false)}
        >
          <div
            className="rounded-2xl p-4 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                确认后再保存（{previewList.length} 条）
              </span>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 rounded-lg cursor-pointer border-none bg-transparent"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
              {previewList.some((p) => p.url)
                ? 'YouTube 标题已经自动清洗过，菜名不对的你可以直接改；食材、菜系、主料建议也顺手补上，这样排菜和采购清单才准。'
                : '截图识别结果不一定准，菜名、食材、菜系、主料请核对后再保存。'}
            </p>
            <div className="flex flex-col gap-3">
              {previewList.map((p, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.url ? (
                      <>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(201,169,110,0.12)', color: 'var(--accent-dark)' }}>
                          {PLATFORM_LABEL[p.platform]}
                        </span>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] truncate max-w-[200px]"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {p.url}
                        </a>
                      </>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(110,139,90,0.12)', color: '#6E8B5A' }}>
                        截图识别
                      </span>
                    )}
                  </div>
                  <input
                    value={p.title}
                    onChange={(e) => updatePreview(i, { title: e.target.value })}
                    placeholder="菜名"
                    className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  <input
                    value={p.ingredients.join('、')}
                    onChange={(e) =>
                      updatePreview(i, {
                        ingredients: e.target.value.split(/[、,，\s]+/).map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="食材，用、分隔"
                    className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                  <div className="flex gap-2">
                    <input
                      value={p.cuisine || ''}
                      onChange={(e) => updatePreview(i, { cuisine: e.target.value.trim() })}
                      placeholder="菜系"
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <select
                      value={p.mainIngredient || 'other'}
                      onChange={(e) => {
                        const m = e.target.value as MainIngredient;
                        updatePreview(i, { mainIngredient: m, proteinTier: defaultTierOf(m) });
                      }}
                      className="px-2 py-1.5 rounded-lg text-[12px] border outline-none"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      {MAIN_INGREDIENT_ORDER.map((m) => (
                        <option key={m} value={m}>{MAIN_INGREDIENT_LABEL[m]}</option>
                      ))}
                    </select>
                    <select
                      value={p.proteinTier || defaultTierOf(p.mainIngredient || 'other')}
                      onChange={(e) => updatePreview(i, { proteinTier: e.target.value as ProteinTier })}
                      className="px-2 py-1.5 rounded-lg text-[12px] border outline-none"
                      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    >
                      {(['main', 'semi', 'veg'] as ProteinTier[]).map((t) => (
                        <option key={t} value={t}>{PROTEIN_TIER_LABEL[t]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSavePreviews}
                className="px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
                style={{ background: 'var(--accent)' }}
              >
                确认保存
              </button>
              <button
                onClick={() => { setShowPreview(false); setPreviewList([]); }}
                className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer border-none"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 列表 */}
      {filtered.length === 0 ? (
        K.recipes.length === 0 ? (
          <div
            className="rounded-2xl py-12 px-6 text-center flex flex-col items-center gap-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              菜谱库还是空的。可以先把历史菜谱导进来当底料，也可以直接收藏视频。
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              <button
                onClick={handleImportLegacy}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
                style={{ background: 'var(--accent)' }}
              >
                <Download size={13} />
                导入 135 道历史菜谱
              </button>
              <button
                onClick={() => setShowAdd(true)}
                className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer"
                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                收视频
              </button>
            </div>
          </div>
        ) : (
          <Empty text="没有匹配的菜，换个条件试试。" />
        )
      ) : (
        <>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {visible.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                editing={editingId === r.id}
                onEdit={() => setEditingId(editingId === r.id ? null : r.id)}
                selected={selected.has(r.id)}
                onToggleSelect={() => toggleSelect(r.id)}
                K={K}
              />
            ))}
          </div>

          {/* 没筛选时只铺一小段，这里给「查看全部 / 收起」 */}
          {!hasFilter && filtered.length > RECIPE_PREVIEW_COUNT && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAllRecipes((v) => !v)}
                className="px-4 py-2 rounded-xl text-[12px] cursor-pointer"
                style={{
                  background: showAllRecipes ? 'transparent' : 'rgba(201,169,110,0.10)',
                  border: showAllRecipes ? '1px solid var(--border)' : 'none',
                  color: showAllRecipes ? 'var(--text-muted)' : 'var(--accent-dark)',
                }}
              >
                {showAllRecipes
                  ? `收起，只看前 ${RECIPE_PREVIEW_COUNT} 道`
                  : `查看全部 ${filtered.length} 道`}
              </button>
            </div>
          )}
        </>
      )}

      {/* 批量删除确认 */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="rounded-2xl p-4 w-full max-w-md"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                删掉这 {selectedRecipes.length} 道菜？
              </span>
              <button
                onClick={() => setConfirmDelete(false)}
                className="cursor-pointer border-none bg-transparent"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={15} />
              </button>
            </div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
              删掉就找不回来了。如果它们已经排进本周菜单，也会一并移出。
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
              只是想让它以后别再被排到的话，用「别再提」就行，不用删。
            </p>
            <div className="rounded-xl p-2.5 mb-3 max-h-36 overflow-y-auto" style={{ background: 'var(--bg)' }}>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {selectedRecipes.map((r) => r.title).join('、')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={doDeleteSelected}
                className="flex-1 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
                style={{ background: 'var(--danger)' }}
              >
                确认删除
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer border-none"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecipeCard({
  recipe, editing, onEdit, selected, onToggleSelect, K,
}: {
  recipe: Recipe;
  editing: boolean;
  onEdit: () => void;
  selected: boolean;
  onToggleSelect: () => void;
  K: Kitchen;
}) {
  const [ingredientDraft, setIngredientDraft] = useState(recipe.ingredients.join('、'));
  const [tagInput, setTagInput] = useState('');
  const [showAddToDay, setShowAddToDay] = useState(false);
  const [addToDayMsg, setAddToDayMsg] = useState('');

  const saveIngredients = () => {
    const list = ingredientDraft
      .split(/[、,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    K.updateRecipe(recipe.id, { ingredients: list });
  };

  /** 补视频链接（或改掉原来那条）：平台自动识别；清空就回到「还没有视频」的状态 */
  const saveUrl = (raw: string) => {
    const url = raw.trim();
    if (!url) {
      // 链接清空 → 这道菜就没有视频来源了，归回「历史菜谱」
      K.updateRecipe(recipe.id, { url: '', platform: 'legacy' });
      return;
    }
    K.updateRecipe(recipe.id, { url, platform: detectPlatform(url) });
  };

  /** 点一下已有标签 = 加/删 */
  const toggleTag = (t: string) => {
    const cur = recipe.tags || [];
    K.updateRecipe(recipe.id, {
      tags: cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t],
    });
  };

  /** 敲一个新标签，回车加上 */
  const commitTagInput = () => {
    const v = tagInput.trim();
    if (!v) return;
    const cur = recipe.tags || [];
    if (!cur.includes(v)) K.updateRecipe(recipe.id, { tags: [...cur, v] });
    setTagInput('');
  };

  const myTags = recipe.tags || [];
  const extraTags = myTags.filter((t) => !K.tagPool.includes(t));

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-2.5"
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: selected ? '0 0 0 2px rgba(201,169,110,0.16)' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onToggleSelect}
          title={selected ? '取消勾选' : '勾上可以批量删'}
          className="shrink-0 mt-0.5 w-4 h-4 rounded flex items-center justify-center cursor-pointer p-0"
          style={{
            border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
            background: selected ? 'var(--accent)' : 'transparent',
          }}
        >
          {selected && <Check size={10} color="#fff" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{recipe.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(201,169,110,0.12)', color: 'var(--accent-dark)' }}>
              {PLATFORM_LABEL[recipe.platform]}
            </span>
            <span className="text-[10px]" style={{ color: STATUS_COLOR[recipe.status] }}>{STATUS_LABEL[recipe.status]}</span>
            {recipe.cuisine && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{recipe.cuisine}</span>}
            {recipe.mainIngredient && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
                {MAIN_INGREDIENT_LABEL[recipe.mainIngredient]}
              </span>
            )}
            {recipe.proteinTier && (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {PROTEIN_TIER_LABEL[recipe.proteinTier]}
              </span>
            )}
            {recipe.isSoup && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>汤</span>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <IconBtn title="编辑" onClick={onEdit}><Pencil size={12} /></IconBtn>
          <IconBtn title="删除" onClick={() => K.deleteRecipe(recipe.id)}><Trash2 size={12} /></IconBtn>
        </div>
      </div>

      {myTags.length > 0 && !editing && (
        <div className="flex gap-1 flex-wrap">
          {myTags.map((t) => (
            <span
              key={t}
              className="text-[10px] px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(110,139,90,0.12)', color: '#6E8B5A' }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {recipe.ingredients.length > 0 && !editing && (
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {recipe.ingredients.join(' · ')}
        </p>
      )}

      {editing && (
        <div className="flex flex-col gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>菜名</label>
          <input
            defaultValue={recipe.title}
            onBlur={(e) => K.updateRecipe(recipe.id, { title: e.target.value.trim() || recipe.title })}
            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            视频链接{recipe.url ? '（换一条就覆盖）' : '（找到视频了？粘进来）'}
          </label>
          <input
            defaultValue={recipe.url}
            onBlur={(e) => saveUrl(e.target.value)}
            placeholder="B站 / 小红书 / 微博 / YouTube 链接"
            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
            style={{
              background: 'var(--bg)',
              borderColor: recipe.url ? 'var(--border)' : 'var(--accent)',
              color: 'var(--text-primary)',
            }}
          />
          <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>食材（用、分隔）</label>
          <input
            value={ingredientDraft}
            onChange={(e) => setIngredientDraft(e.target.value)}
            onBlur={saveIngredients}
            placeholder="五花肉、冰糖、生抽"
            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>菜系</label>
          <input
            defaultValue={recipe.cuisine || ''}
            onBlur={(e) => K.updateRecipe(recipe.id, { cuisine: e.target.value.trim() })}
            placeholder="粤式 / 日式 / 西式…"
            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />

          <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>主料</label>
          <select
            value={recipe.mainIngredient || 'other'}
            onChange={(e) => K.updateRecipe(recipe.id, { mainIngredient: e.target.value as MainIngredient })}
            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            {MAIN_INGREDIENT_ORDER.map((m) => (
              <option key={m} value={m}>{MAIN_INGREDIENT_LABEL[m]}</option>
            ))}
          </select>

          <label className="text-[10px]" style={{ color: 'var(--text-muted)' }}>标签（点一下加/删）</label>
          <div className="flex gap-1 flex-wrap">
            {[...K.tagPool, ...extraTags].map((t) => {
              const on = myTags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  className="px-2 py-1 rounded-lg text-[10px] cursor-pointer border-none"
                  style={{
                    background: on ? 'rgba(110,139,90,0.18)' : 'var(--bg)',
                    color: on ? '#6E8B5A' : 'var(--text-muted)',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitTagInput();
              }
            }}
            onBlur={commitTagInput}
            placeholder="输入新标签，回车添加"
            className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />

          <div className="flex gap-1.5 mt-1">
            {(['want', 'cooked', 'never'] as RecipeStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => K.updateRecipe(recipe.id, { status: s })}
                className="px-2 py-1 rounded-lg text-[10px] cursor-pointer border-none"
                style={{
                  background: recipe.status === s ? 'rgba(201,169,110,0.18)' : 'var(--bg)',
                  color: recipe.status === s ? 'var(--accent-dark)' : 'var(--text-muted)',
                }}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mt-auto pt-1">
        {recipe.url ? (
          <a
            href={recipe.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] no-underline"
            style={{ color: 'var(--accent-dark)' }}
            title={dishLinkHint(recipe)}
          >
            <ExternalLink size={11} />
            看视频
          </a>
        ) : editing ? (
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>在上面粘链接</span>
        ) : (
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-[11px] cursor-pointer border-none bg-transparent p-0"
            style={{ color: 'var(--accent-dark)' }}
            title="找到这道菜的视频了？点一下把链接粘进来"
          >
            <Plus size={11} />
            还没有视频 · 补链接
          </button>
        )}
        <button
          onClick={() => { setShowAddToDay((v) => !v); setAddToDayMsg(''); }}
          className="flex items-center gap-1 text-[11px] cursor-pointer border-none bg-transparent p-0 ml-auto"
          style={{ color: 'var(--accent-dark)' }}
          title="把这道菜加到本周菜单的某一天"
        >
          <Calendar size={11} />
          加进菜单
        </button>
        {recipe.status !== 'cooked' && (
          <button
            onClick={() => K.markCooked(recipe.id)}
            className="flex items-center gap-1 text-[11px] cursor-pointer border-none bg-transparent"
            style={{ color: '#6E8B5A' }}
          >
            <Check size={11} />
            做过了
          </button>
        )}
      </div>

      {showAddToDay && (
        <div className="mt-1 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-[10px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
            加到当前周（{K.plan.days[0]?.date.slice(5)} - {K.plan.days[6]?.date.slice(5)}）的某天：
          </p>
          <div className="grid grid-cols-7 gap-1">
            {K.plan.days.map((d) => {
              const already = d.recipeIds.includes(recipe.id);
              return (
                <button
                  key={d.date}
                  disabled={already}
                  onClick={() => {
                    if (already) return;
                    const ok = K.addRecipeToDay(d.date, recipe.id);
                    if (ok) {
                      setAddToDayMsg(`已加到 ${d.label}`);
                      setTimeout(() => setAddToDayMsg(''), 1500);
                    }
                  }}
                  className="py-1.5 rounded-lg text-[10px] cursor-pointer border-none disabled:cursor-not-allowed"
                  style={{
                    background: already ? 'var(--border)' : 'rgba(201,169,110,0.08)',
                    color: already ? 'var(--text-muted)' : 'var(--accent-dark)',
                    opacity: already ? 0.6 : 1,
                  }}
                >
                  {already ? '已在' : d.label}
                </button>
              );
            })}
          </div>
          {addToDayMsg && (
            <p className="text-[10px] mt-1.5" style={{ color: 'var(--accent-dark)' }}>{addToDayMsg}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ============ 本周菜单 ============ */

function WeekPlan({ K }: { K: Kitchen }) {
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [moveFrom, setMoveFrom] = useState<{ date: string; recipeId: number } | null>(null);
  /** 加菜弹层里「自己打一道菜」的输入 */
  const [manualTitle, setManualTitle] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');
  const [manualMain, setManualMain] = useState<MainIngredient>('pork');
  const [manualTier, setManualTier] = useState<ProteinTier>('main');
  const [pickerMsg, setPickerMsg] = useState('');
  const manualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(''), 2400);
    return () => clearTimeout(t);
  }, [flash]);

  const range = useMemo(() => {
    if (K.plan.days.length === 0) return '';
    const a = K.plan.days[0].date;
    const b = K.plan.days[K.plan.days.length - 1].date;
    return `${a.slice(5).replace('-', '.')} - ${b.slice(5).replace('-', '.')}`;
  }, [K.plan]);

  const goPrevWeek = () => {
    const d = new Date(`${K.currentWeek}T00:00:00`);
    d.setDate(d.getDate() - 7);
    K.setWeekStart(toDateStr(d));
  };

  const goNextWeek = () => {
    const d = new Date(`${K.currentWeek}T00:00:00`);
    d.setDate(d.getDate() + 7);
    K.setWeekStart(toDateStr(d));
  };

  const goThisWeek = () => {
    K.setWeekStart(toDateStr(getWeekStart()));
  };

  const pickerDay = K.plan.days.find((d) => d.date === pickerDate);
  const copyDaySrc = K.plan.days.find((d) => d.date === copyFrom);

  const emptyPool = K.recipes.filter((r) => r.status !== 'never').length === 0;

  const closeCopy = () => {
    setCopyFrom(null);
    setCopyTargets(new Set());
  };

  const openPicker = (date: string) => {
    setPickerDate(date);
    setPickerMsg('');
    setManualTitle('');
    setManualIngredients('');
    setManualMain('pork');
    setManualTier('main');
  };

  /** 自己打一道菜加进这天 —— 同时写进菜谱库，以后还能被排到 */
  const submitManualDish = (date: string) => {
    const t = manualTitle.trim();
    if (!t) return;
    const ingredients = manualIngredients
      .split(/[、,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const res = K.addManualDish(date, {
      title: t,
      mainIngredient: manualMain,
      proteinTier: manualTier,
      ingredients,
    });
    if (!res) return;
    setManualTitle('');
    setManualIngredients('');
    setPickerMsg(
      res.alreadyInDay
        ? `「${t}」今天已经在菜单里了`
        : res.reused
          ? `「${t}」菜谱库里已经有了，直接加进来${ingredients.length > 0 ? '（食材也并进去了）' : ''}`
          : `已加上「${t}」，也存进菜谱库了${ingredients.length > 0 ? '，食材一起记下了' : ''}`
    );
    manualInputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={goPrevWeek}
            className="p-1.5 rounded-lg cursor-pointer border-none bg-transparent"
            style={{ color: 'var(--text-muted)' }}
            title="上一周"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setShowCalendar(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer border-none"
            style={{ background: 'rgba(201,169,110,0.08)' }}
            title="点击选周"
          >
            <Calendar size={13} style={{ color: 'var(--accent-dark)' }} />
            <span className="text-[12px]" style={{ color: 'var(--accent-dark)' }}>{range}</span>
          </button>
          <button
            onClick={goNextWeek}
            className="p-1.5 rounded-lg cursor-pointer border-none bg-transparent"
            style={{ color: 'var(--text-muted)' }}
            title="下一周"
          >
            <ChevronRight size={16} />
          </button>
          {K.currentWeek !== toDateStr(getWeekStart()) && (
            <button
              onClick={goThisWeek}
              className="px-2 py-1 rounded-lg text-[11px] cursor-pointer border-none"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              本周
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const r = K.autoPlan(2);
                if (!r.ok) {
                  setFlash('菜谱库是空的，先收几道菜');
                  return;
                }
                setFlash(
                  `整周重排好了${r.kept > 0 ? ` · 你手加的 ${r.kept} 道原位没动` : ''} · 再点一次换一批`
                );
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
              style={{ background: 'var(--accent)' }}
            >
              <RotateCcw size={13} />
              一键排菜
            </button>
            <button
              onClick={K.clearWeek}
              title="整周清空 —— 你手加的一起清掉"
              className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer border-none"
              style={{ background: 'transparent', color: 'var(--text-muted)' }}
            >
              清空
            </button>
          </div>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            可以反复点，每次都会换一批；你手加的菜不会被换掉
          </span>
        </div>
      </div>

      {flash && (
        <div className="self-start px-3 py-1.5 rounded-full text-[11px]" style={{ background: 'rgba(201,169,110,0.15)', color: 'var(--accent-dark)' }}>
          {flash}
        </div>
      )}

      {emptyPool && (
        <div className="rounded-xl px-3.5 py-2.5 text-[11px]" style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--accent-dark)' }}>
          现在没有可用来排菜的菜（库是空的，或全被标成了「别再提」）。先去「菜谱库」收录几道。
        </div>
      )}

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {K.plan.days.map((day) => (
          <div key={day.date} className="rounded-2xl p-3.5 flex flex-col gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{day.label}</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{day.date.slice(5)}</span>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              {day.recipeIds.length === 0 && (
                <p className="text-[11px] py-2" style={{ color: 'var(--text-muted)' }}>还没排</p>
              )}
              {day.recipeIds.map((id) => {
                const r = K.recipeMap.get(id);
                if (!r) return null;
                const hasVideo = !!r.url;
                const isManual = (day.manualIds || []).includes(id);
                return (
                  <div key={id} className="flex items-center gap-1.5 text-[11px] group" style={{ color: 'var(--text-secondary)' }}>
                    <span
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{ background: isManual ? 'var(--accent)' : 'var(--border)' }}
                      title={isManual ? '你自己加的，重排时保留' : ''}
                    />
                    <a
                      href={dishLink(r)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 flex-1 min-w-0 no-underline py-0.5"
                      style={{ color: hasVideo ? 'var(--accent-dark)' : 'var(--text-secondary)' }}
                      title={dishLinkHint(r)}
                    >
                      <span className="truncate">{r.title}</span>
                      <ExternalLink size={10} className="shrink-0 opacity-70" />
                    </a>
                    <button
                      onClick={() => setMoveFrom({ date: day.date, recipeId: id })}
                      className="opacity-60 md:opacity-0 md:group-hover:opacity-100 cursor-pointer border-none bg-transparent p-0 shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                      title="移到别的日子"
                    >
                      <Move size={11} />
                    </button>
                    <button
                      onClick={() => K.toggleRecipeInDay(day.date, id)}
                      className="opacity-60 md:opacity-0 md:group-hover:opacity-100 cursor-pointer border-none bg-transparent p-0 shrink-0"
                      style={{ color: 'var(--text-muted)' }}
                      title="移出"
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => openPicker(day.date)}
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] cursor-pointer border-none flex-1"
                style={{ background: 'rgba(201,169,110,0.08)', color: 'var(--accent-dark)' }}
              >
                <Plus size={11} />
                加菜
              </button>
              <button
                onClick={() => {
                  const r = K.rerollDay(day.date, 2);
                  if (!r.ok) {
                    setFlash('菜谱库是空的，先收几道菜');
                    return;
                  }
                  if (r.added === 0 && r.kept > 0) {
                    setFlash(`${day.label} 的菜都是你手动加的，没动它们`);
                    return;
                  }
                  setFlash(
                    `${day.label} 换了一批${r.kept > 0 ? ` · 你手加的 ${r.kept} 道保留` : ''}`
                  );
                }}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer border-none"
                style={{ background: 'rgba(201,169,110,0.08)', color: 'var(--accent-dark)' }}
                title="只重排这一天，可以反复点；你手加的菜会保留"
              >
                <RotateCcw size={11} />
                换
              </button>
              <button
                onClick={() => { setCopyFrom(day.date); setCopyTargets(new Set()); }}
                disabled={day.recipeIds.length === 0}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border-none"
                style={{
                  background: 'rgba(201,169,110,0.08)',
                  color: day.recipeIds.length === 0 ? 'var(--text-muted)' : 'var(--accent-dark)',
                  opacity: day.recipeIds.length === 0 ? 0.45 : 1,
                  cursor: day.recipeIds.length === 0 ? 'not-allowed' : 'pointer',
                }}
                title={day.recipeIds.length === 0 ? '这天还没有菜' : '把这一天的菜复制到别的日子'}
              >
                <Copy size={11} />
                复制
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 复制到其它日子 */}
      {copyFrom && copyDaySrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={closeCopy}>
          <div
            className="rounded-2xl p-4 w-full max-w-md"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {copyDaySrc.label} 的菜 → 复制到
              </span>
              <button onClick={closeCopy} className="cursor-pointer border-none bg-transparent" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>
            <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
              内容是：{copyDaySrc.recipeIds.map((id) => K.recipeMap.get(id)?.title).filter(Boolean).join(' · ') || '（空）'}
            </p>
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
              会覆盖所选那天原有的菜，可以多选。
            </p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {K.plan.days.filter((d) => d.date !== copyFrom).map((d) => {
                const on = copyTargets.has(d.date);
                return (
                  <button
                    key={d.date}
                    onClick={() =>
                      setCopyTargets((prev) => {
                        const s = new Set(prev);
                        if (s.has(d.date)) s.delete(d.date);
                        else s.add(d.date);
                        return s;
                      })
                    }
                    className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer border-none"
                    style={{
                      background: on ? 'var(--accent)' : 'var(--bg)',
                      color: on ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const cnt = K.copyDay(copyFrom, Array.from(copyTargets));
                  if (cnt > 0) {
                    setFlash(`已复制到 ${cnt} 天`);
                    closeCopy();
                  } else {
                    setFlash('先选要复制到哪几天');
                  }
                }}
                className="flex-1 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
                style={{ background: 'var(--accent)' }}
              >
                复制到所选日子
              </button>
              <button
                onClick={closeCopy}
                className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer border-none"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 移动菜品到其它日子 */}
      {moveFrom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={() => setMoveFrom(null)}>
          <div
            className="rounded-2xl p-4 w-full max-w-sm"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                把「{K.recipeMap.get(moveFrom.recipeId)?.title}」移到
              </span>
              <button onClick={() => setMoveFrom(null)} className="cursor-pointer border-none bg-transparent" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {K.plan.days.map((d) => {
                const isToday = d.date === moveFrom.date;
                return (
                  <button
                    key={d.date}
                    disabled={isToday}
                    onClick={() => {
                      K.moveRecipe(moveFrom.date, d.date, moveFrom.recipeId);
                      setMoveFrom(null);
                    }}
                    className="py-2 rounded-lg text-[12px] cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: isToday ? 'var(--border)' : 'rgba(201,169,110,0.08)',
                      color: isToday ? 'var(--text-muted)' : 'var(--accent-dark)',
                    }}
                  >
                    {d.label} <span className="text-[10px] opacity-70">{d.date.slice(5)}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              移动后这道菜在目标日会保留「手动」标记。
            </p>
          </div>
        </div>
      )}

      {/* 日历选周弹层 */}
      {showCalendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={() => setShowCalendar(false)}>
          <div
            className="rounded-2xl p-4 w-full max-w-sm"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                选一周
              </span>
              <button onClick={() => setShowCalendar(false)} className="cursor-pointer border-none bg-transparent" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>
            <InlineWeekPicker current={K.currentWeek} onPick={(ws) => { K.setWeekStart(ws); setShowCalendar(false); }} />
          </div>
        </div>
      )}

      {/* 选菜弹层 */}
      {pickerDate && pickerDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={() => setPickerDate(null)}>
          <div
            className="rounded-2xl p-4 w-full max-w-xl max-h-[75vh] overflow-y-auto"
            style={{ background: 'var(--bg-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {pickerDay.label} 加菜
              </span>
              <button onClick={() => setPickerDate(null)} className="cursor-pointer border-none bg-transparent" style={{ color: 'var(--text-muted)' }}>
                <X size={15} />
              </button>
            </div>

            {/* 自己打一道菜 */}
            <div className="mb-3 pb-3 flex flex-col gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                自己打一道菜（会自动存进菜谱库，以后也能排到）
              </span>
              <div className="flex gap-2 flex-wrap">
                <input
                  ref={manualInputRef}
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitManualDish(pickerDay.date);
                    }
                  }}
                  placeholder="菜名，例如 番茄炒蛋"
                  className="flex-1 min-w-[130px] px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                />
                <select
                  value={manualMain}
                  onChange={(e) => {
                    const m = e.target.value as MainIngredient;
                    setManualMain(m);
                    setManualTier(defaultTierOf(m));
                  }}
                  title="主料 —— 排菜时用来避开「三天都吃鸡」"
                  className="px-2 py-1.5 rounded-lg text-[12px] border outline-none cursor-pointer"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {MAIN_INGREDIENT_ORDER.map((m) => (
                    <option key={m} value={m}>{MAIN_INGREDIENT_LABEL[m]}</option>
                  ))}
                </select>
                <select
                  value={manualTier}
                  onChange={(e) => setManualTier(e.target.value as ProteinTier)}
                  title="荤素 —— 一顿饭不能两道都是素"
                  className="px-2 py-1.5 rounded-lg text-[12px] border outline-none cursor-pointer"
                  style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                >
                  {(['main', 'semi', 'veg'] as ProteinTier[]).map((t) => (
                    <option key={t} value={t}>{PROTEIN_TIER_LABEL[t]}</option>
                  ))}
                </select>
                <button
                  onClick={() => submitManualDish(pickerDay.date)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white border-none"
                  style={{
                    background: 'var(--accent)',
                    opacity: manualTitle.trim() ? 1 : 0.45,
                    cursor: manualTitle.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  <CornerDownLeft size={11} />
                  加进这天
                </button>
              </div>
              <input
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submitManualDish(pickerDay.date);
                  }
                }}
                placeholder="食材（可不填，用、分隔，例如 番茄、鸡蛋）"
                className="w-full px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
                style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
              {pickerMsg && (
                <p className="text-[11px]" style={{ color: 'var(--accent-dark)' }}>{pickerMsg}</p>
              )}
            </div>

            {K.recipes.length === 0 ? (
              <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>菜谱库是空的，先去「菜谱库」收藏几个视频。</p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-[11px] mb-1" style={{ color: 'var(--text-muted)' }}>
                  也可以从下面勾 —— 勾进来的同样算你手动加的，以后重排不会动它们。
                </p>
                {K.recipes.map((r) => {
                  const picked = pickerDay.recipeIds.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: picked ? 'rgba(201,169,110,0.12)' : 'transparent' }}
                    >
                      <button
                        onClick={() => K.toggleRecipeInDay(pickerDay.date, r.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left text-[12px] cursor-pointer border-none bg-transparent p-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center"
                          style={{ border: `1px solid ${picked ? 'var(--accent)' : 'var(--border)'}`, background: picked ? 'var(--accent)' : 'transparent' }}
                        >
                          {picked && <Check size={9} color="#fff" />}
                        </span>
                        <span className="truncate flex-1">{r.title}</span>
                        <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>{PLATFORM_LABEL[r.platform]}</span>
                      </button>
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="shrink-0 flex items-center no-underline"
                          style={{ color: 'var(--accent-dark)' }}
                          title="先看一眼视频"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ 日历选周组件 ============ */

function InlineWeekPicker({ current, onPick }: { current: string; onPick: (weekStart: string) => void }) {
  const [view, setView] = useState(new Date(`${current}T00:00:00`));

  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 周一起始
  const days: Date[] = [];
  const totalCells = 42; // 6 行 × 7 列
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, month, 1 - startOffset + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  const currentWeekStart = new Date(`${current}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isInCurrentWeek = (d: Date) => {
    const ws = getWeekStart(d);
    return ws.getTime() === currentWeekStart.getTime();
  };

  const handlePick = (d: Date) => {
    const ws = getWeekStart(d);
    onPick(toDateStr(ws));
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="p-1 rounded-lg cursor-pointer border-none bg-transparent"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {year} 年 {month + 1} 月
        </span>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="p-1 rounded-lg cursor-pointer border-none bg-transparent"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['一', '二', '三', '四', '五', '六', '日'].map((l) => (
          <div key={l} className="text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>{l}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const isCurrentMonth = d.getMonth() === month;
          const inCurrentWeek = isInCurrentWeek(d);
          const isToday = d.getTime() === today.getTime();
          return (
            <button
              key={d.getTime()}
              onClick={() => handlePick(d)}
              className="aspect-square rounded-lg text-[12px] cursor-pointer border-none flex items-center justify-center"
              style={{
                background: inCurrentWeek ? 'var(--accent)' : isToday ? 'rgba(201,169,110,0.15)' : 'transparent',
                color: inCurrentWeek ? '#fff' : isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                opacity: isCurrentMonth ? 1 : 0.5,
              }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
        点任意日期，会自动跳到它所在的那一周（周一开始）。
      </p>
    </div>
  );
}

/* ============ 采购清单 ============ */

function ShoppingList({ K }: { K: Kitchen }) {
  const [copied, setCopied] = useState(false);

  const copyAll = async () => {
    const text = K.shoppingList
      .map((s) => `${s.checked ? '✓' : '□'} ${s.name}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const missing = K.plannedRecipes.filter((r) => r.ingredients.length === 0);
  const pending = K.plannedRecipes.filter((r) => (r.pendingIngredients || []).length > 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <ShoppingCart size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            本周 {K.plannedRecipes.length} 道菜，共 {K.shoppingList.length} 样食材
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
            style={{ background: 'var(--accent)' }}
          >
            <Copy size={13} />
            {copied ? '已复制' : '复制清单'}
          </button>
          <button
            onClick={K.resetChecked}
            className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer border-none"
            style={{ background: 'transparent', color: 'var(--text-muted)' }}
          >
            重置勾选
          </button>
        </div>
      </div>

      {K.shoppingList.length === 0 ? (
        <Empty text="本周菜单还是空的，或者排的菜还没填食材。先去「本周菜单」排菜，再回到菜谱卡里补上食材。" />
      ) : (
        <div className="rounded-2xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="grid gap-x-6 gap-y-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {K.shoppingList.map((s) => (
              <button
                key={s.name}
                onClick={() => K.toggleChecked(s.name)}
                className="flex items-center gap-2 py-1.5 text-left cursor-pointer border-none bg-transparent"
                title={s.recipeTitles.join('、')}
              >
                <span
                  className="w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center"
                  style={{ border: `1px solid ${s.checked ? 'var(--accent)' : 'var(--border)'}`, background: s.checked ? 'var(--accent)' : 'transparent' }}
                >
                  {s.checked && <Check size={9} color="#fff" />}
                </span>
                <span
                  className="text-[12px] truncate"
                  style={{ color: s.checked ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: s.checked ? 'line-through' : 'none' }}
                >
                  {s.name}
                </span>
                <span className="text-[10px] ml-auto shrink-0" style={{ color: 'var(--text-muted)' }}>{s.recipeTitles.length}菜</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="rounded-2xl p-4 flex gap-2" style={{ background: 'rgba(201,169,110,0.10)', border: '1px solid var(--border)' }}>
          <AlertTriangle size={13} style={{ color: 'var(--accent-dark)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              有 {pending.length} 道菜的食材是推测的、还没确认，未计入清单：
            </p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
              {pending.map((m) => m.title).join('、')}
            </p>
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(201,169,110,0.06)', border: '1px solid var(--border)' }}>
          <p className="text-[11px] mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            这些菜还没填食材，不会进清单：
          </p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {missing.map((m) => m.title).join('、')}
          </p>
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
            到「菜谱库」点每张卡右上角的铅笔，补一句食材就行。
          </p>
        </div>
      )}
    </div>
  );
}

/* ============ 统计面板 ============ */

function StatsPanel({ K }: { K: Kitchen }) {
  const { range, setRange } = useStatsRange(K);
  const stats = useMemo(() => {
    return computeStats(K.plans, K.recipes, range.from, range.to);
  }, [K.plans, K.recipes, range]);

  const hasData = stats.totalMeals > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <BarChart3 size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>吃了什么</span>
        </div>
        <div className="flex gap-1.5">
          <Chip active={range.mode === 'week'} onClick={() => setRange({ mode: 'week' })} label="本周" />
          <Chip active={range.mode === 'month'} onClick={() => setRange({ mode: 'month' })} label="本月" />
          <Chip active={range.mode === 'custom'} onClick={() => setRange({ mode: 'custom' })} label="自定义" />
        </div>
      </div>

      {range.mode === 'custom' && (
        <div className="rounded-2xl p-4 flex flex-wrap gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>从</span>
            <input
              type="date"
              value={range.from}
              onChange={(e) => setRange({ mode: 'custom', from: e.target.value, to: range.to })}
              className="px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>到</span>
            <input
              type="date"
              value={range.to}
              onChange={(e) => setRange({ mode: 'custom', from: range.from, to: e.target.value })}
              className="px-2.5 py-1.5 rounded-lg text-[12px] border outline-none"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      )}

      {!hasData ? (
        <Empty text={`${range.mode === 'week' ? '本周' : range.mode === 'month' ? '本月' : '所选时间段'}还没排菜，去「本周菜单」先排几餐再来。`} />
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          <StatCard title="餐桌概览" icon={<UtensilsCrossed size={14} style={{ color: 'var(--accent)' }} />}>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <Number value={stats.totalDishes} label="不重复的菜" />
              <Number value={stats.totalMeals} label="餐次" />
              <Number value={stats.uniqueIngredients} label="不重复的食材" />
              <Number value={stats.antiInflammatoryCount} label="抗炎食材" />
            </div>
          </StatCard>

          <StatCard title="蛋白质结构" icon={<Beef size={14} style={{ color: 'var(--accent)' }} />}>
            <div className="flex flex-col gap-2 mt-1">
              {Object.entries(stats.mainGroups).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-[11px]">
                  <span className="w-14 shrink-0" style={{ color: 'var(--text-secondary)' }}>{k}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--bg)' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.round((v / stats.totalMeals) * 100)}%`,
                        background: 'var(--accent)',
                      }}
                    />
                  </div>
                  <span className="w-8 text-right" style={{ color: 'var(--text-muted)' }}>{v}</span>
                </div>
              ))}
            </div>
          </StatCard>

          <StatCard title="食材颜色盘" icon={<Palette size={14} style={{ color: 'var(--accent)' }} />}>
            <ColorDonut data={stats.colorGroups} />
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(stats.colorGroups).sort((a, b) => b[1] - a[1]).map(([color, count]) => (
                <span key={color} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,169,110,0.08)', color: 'var(--text-secondary)' }}>
                  {color} {count}
                </span>
              ))}
            </div>
          </StatCard>

          <StatCard title="Top 食材" icon={<Carrot size={14} style={{ color: 'var(--accent)' }} />}>
            <div className="flex flex-col gap-1.5 mt-1">
              {stats.topIngredients.map((it) => (
                <div key={it.name} className="flex items-center justify-between text-[11px]">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {it.name}
                    {it.antiInflammatory && <span className="ml-1 text-[9px]" style={{ color: 'var(--accent)' }}>抗炎</span>}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>{it.count} 次 · {it.recipes.length} 菜</span>
                </div>
              ))}
            </div>
          </StatCard>

          <StatCard title="菜系风味" icon={<Globe size={14} style={{ color: 'var(--accent)' }} />}>
            <div className="flex flex-col gap-2 mt-1">
              {Object.entries(stats.cuisineGroups).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-[11px]">
                  <span className="w-14 shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>{k || '未分类'}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--bg)' }}>
                    <div className="h-2 rounded-full" style={{ width: `${Math.round((v / stats.totalMeals) * 100)}%`, background: '#6E8B5A' }} />
                  </div>
                  <span className="w-8 text-right" style={{ color: 'var(--text-muted)' }}>{v}</span>
                </div>
              ))}
            </div>
          </StatCard>

          <StatCard title="重复出现的菜" icon={<Repeat size={14} style={{ color: 'var(--accent)' }} />}>
            {stats.repeats.length === 0 ? (
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>这段时间里没有重复菜，餐桌很丰富。</p>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                {stats.repeats.map((r) => (
                  <div key={r.recipeId} className="flex items-center justify-between text-[11px]">
                    <span style={{ color: 'var(--text-secondary)' }}>{r.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{r.count} 次</span>
                  </div>
                ))}
              </div>
            )}
          </StatCard>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function Number({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(201,169,110,0.06)' }}>
      <div className="text-[22px] font-medium" style={{ color: 'var(--accent-dark)', fontFamily: SERIF }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

function ColorDonut({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>暂无颜色数据。</p>;
  const colors: Record<string, string> = { 红: '#D94F4F', 橙黄: '#E8A838', 绿: '#6E8B5A', 白: '#CFC8B8', 紫黑: '#6B5B95', 粉棕: '#C9A96E' };
  let acc = 0;
  const segments = Object.entries(data).map(([k, v]) => {
    const start = acc;
    const frac = v / total;
    acc += frac;
    return { label: k, value: v, frac, start, color: colors[k] || 'var(--accent)' };
  });
  return (
    <svg viewBox="0 0 36 36" className="w-24 h-24 self-center mt-2">
      {segments.map((s) => {
        const startAngle = s.start * 360;
        const endAngle = (s.start + s.frac) * 360;
        const largeArc = s.frac > 0.5 ? 1 : 0;
        const rad = Math.PI / 180;
        const x1 = 18 + 14 * Math.cos((startAngle - 90) * rad);
        const y1 = 18 + 14 * Math.sin((startAngle - 90) * rad);
        const x2 = 18 + 14 * Math.cos((endAngle - 90) * rad);
        const y2 = 18 + 14 * Math.sin((endAngle - 90) * rad);
        const x3 = 18 + 10 * Math.cos((endAngle - 90) * rad);
        const y3 = 18 + 10 * Math.sin((endAngle - 90) * rad);
        const x4 = 18 + 10 * Math.cos((startAngle - 90) * rad);
        const y4 = 18 + 10 * Math.sin((startAngle - 90) * rad);
        return (
          <path
            key={s.label}
            d={`M ${x1} ${y1} A 14 14 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A 10 10 0 ${largeArc} 0 ${x4} ${y4} Z`}
            fill={s.color}
          />
        );
      })}
    </svg>
  );
}

type RangeMode = 'week' | 'month' | 'custom';

function useStatsRange(K: Kitchen) {
  const [mode, setMode] = useState<RangeMode>('week');
  const [custom, setCustom] = useState<{ from: string; to: string }>(() => {
    const today = new Date();
    const ws = getWeekStart(today);
    const from = toDateStr(ws);
    const to = toDateStr(new Date(ws.getTime() + 6 * 86400000));
    return { from, to };
  });

  const { min, max } = useMemo(() => planDateRange(K.plans), [K.plans]);

  const range = useMemo(() => {
    if (mode === 'week') {
      const ws = toDateStr(getWeekStart());
      return { mode, from: ws, to: toDateStr(new Date(new Date(`${ws}T00:00:00`).getTime() + 6 * 86400000)) };
    }
    if (mode === 'month') {
      const today = new Date();
      const y = today.getFullYear();
      const m = today.getMonth();
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      const from = toDateStr(getWeekStart(firstDay));
      const to = toDateStr(getWeekStart(lastDay));
      return { mode, from, to };
    }
    return { mode, from: custom.from, to: custom.to };
  }, [mode, custom]);

  const setRange = (next: { mode: RangeMode; from?: string; to?: string }) => {
    setMode(next.mode);
    if (next.from && next.to) setCustom({ from: next.from, to: next.to });
  };

  return { range, setRange, min, max };
}

/* ============ 小组件 ============ */

function FilterRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] shrink-0 pt-1.5 w-7" style={{ color: 'var(--text-muted)' }}>{title}</span>
      <div className="flex gap-1.5 flex-wrap flex-1">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer border-none transition-colors"
      style={{
        background: active ? 'rgba(201,169,110,0.18)' : 'var(--bg)',
        color: active ? 'var(--accent-dark)' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}

function IconBtn({ children, onClick, title }: { children: ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg cursor-pointer border-none bg-transparent"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl py-12 px-6 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{text}</p>
    </div>
  );
}
