import {
  useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react';
import {
  Plus, Search, Trash2, ExternalLink, Check, X, Copy, Pencil,
  ShoppingCart, Calendar, RotateCcw, Download, AlertTriangle, CornerDownLeft,
} from 'lucide-react';
import type {
  Recipe, RecipePlatform, RecipeStatus, MainIngredient, ProteinTier,
} from '../types';
import {
  useKitchen, PLATFORM_LABEL, MAIN_INGREDIENT_LABEL, MAIN_INGREDIENT_ORDER,
  PROTEIN_TIER_LABEL, defaultTierOf, detectPlatform,
} from '../hooks/useKitchen';

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

type Tab = 'recipes' | 'plan' | 'shopping';

export default function KitchenPage() {
  const K = useKitchen();
  const [tab, setTab] = useState<Tab>('recipes');

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'recipes', label: '菜谱库', count: K.stats.total },
    { key: 'plan', label: '本周菜单', count: K.stats.planned },
    { key: 'shopping', label: '采购清单', count: K.shoppingList.length },
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
    </div>
  );
}

type Kitchen = ReturnType<typeof useKitchen>;

/* ============ 菜谱库 ============ */

function RecipeLibrary({ K }: { K: Kitchen }) {
  const [keyword, setKeyword] = useState('');
  const [platform, setPlatform] = useState<RecipePlatform | 'all'>('all');
  const [main, setMain] = useState<MainIngredient | 'all'>('all');
  const [cuisine, setCuisine] = useState<string>('all');
  const [status, setStatus] = useState<RecipeStatus | 'all'>('all');
  const [tag, setTag] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importMsg, setImportMsg] = useState('');
  /** 批量删除：勾中的菜谱 id */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  /** 是否点了「查看全部」—— 没筛选时默认只铺一小段 */
  const [showAllRecipes, setShowAllRecipes] = useState(false);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return K.recipes.filter((r) => {
      if (platform !== 'all' && r.platform !== platform) return false;
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
  }, [K.recipes, keyword, platform, main, cuisine, status, tag]);

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
    setMain('all');
    setCuisine('all');
    setStatus('all');
    setTag('all');
  };

  const hasFilter = platform !== 'all' || main !== 'all' || cuisine !== 'all' || status !== 'all' || tag !== 'all' || !!keyword.trim();

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

  const handleAdd = () => {
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
        return { title: title || '未命名', url };
      })
      .filter((x): x is { title: string; url: string } => !!x);

    if (parsed.length === 0) return;
    K.addRecipesByLinks(parsed);
    setDraft('');
    setShowAdd(false);
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

        {showAdd && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
              每行一条，可直接粘链接；也可以写成「菜名 链接」。平台会自动识别。
            </p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder={'红烧肉 https://www.bilibili.com/video/BV1xx\nhttps://www.xiaohongshu.com/explore/xxx'}
              className="w-full px-3 py-2 rounded-xl text-[12px] border outline-none resize-y"
              style={{ background: 'var(--bg)', borderColor: 'var(--border)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAdd}
                className="px-3.5 py-2 rounded-xl text-[12px] font-medium text-white cursor-pointer border-none"
                style={{ background: 'var(--accent)' }}
              >
                确认添加
              </button>
              <button
                onClick={() => { setShowAdd(false); setDraft(''); }}
                className="px-3.5 py-2 rounded-xl text-[12px] cursor-pointer border-none"
                style={{ background: 'transparent', color: 'var(--text-muted)' }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

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
        {recipe.status !== 'cooked' && (
          <button
            onClick={() => K.markCooked(recipe.id)}
            className="flex items-center gap-1 text-[11px] cursor-pointer border-none bg-transparent ml-auto"
            style={{ color: '#6E8B5A' }}
          >
            <Check size={11} />
            做过了
          </button>
        )}
      </div>
    </div>
  );
}

/* ============ 本周菜单 ============ */

function WeekPlan({ K }: { K: Kitchen }) {
  const [pickerDate, setPickerDate] = useState<string | null>(null);
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const [copyTargets, setCopyTargets] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState('');
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
    return `${a} ~ ${b}`;
  }, [K.plan]);

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
          <Calendar size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{range}</span>
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
