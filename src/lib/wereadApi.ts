import { getWereadCookie } from './wereadCookie';
import type { WereadHighlightEntry } from '../types';

/** 开发环境走 Vite 代理；生产静态页无代理，需本地 dev 导入或使用粘贴导入 */
export function isWereadApiAvailable(): boolean {
  return import.meta.env.DEV === true;
}

function basePrefix(): string {
  return (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
}

function iUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${basePrefix()}/weread-i${p}`;
}

function originUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${basePrefix()}/weread-origin${p}`;
}

async function fetchWeread(url: string, init?: RequestInit): Promise<Response> {
  const cookie = getWereadCookie().trim();
  if (!cookie) {
    throw new Error('请先在 Library 中保存微信读书 Cookie');
  }
  return fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      'X-Weread-Cookie': cookie,
      Accept: 'application/json, text/plain, */*',
    },
  });
}

/** 预热会话（与常见脚本一致） */
async function touchOrigin(): Promise<void> {
  await fetchWeread(originUrl('/'), { method: 'GET' });
}

export interface WereadImportPayload {
  bookId: string;
  title: string;
  author: string;
  highlights: WereadHighlightEntry[];
}

/** 微信读书书架书目 — 不含划线 */
export interface WereadBookPayload {
  bookId: string;
  title: string;
  author: string;
  /** 阅读状态：1-在读, 2-读完, 3-想读, 4-暂停 */
  readStatus: 1 | 2 | 3 | 4;
  /** 分类标签（微信读书的分类，如"心理学""育儿"等） */
  category?: string;
  /** 封面 URL */
  cover?: string;
}

function formatApiTime(sec: unknown): string {
  if (typeof sec === 'number' && sec > 1e9) {
    const d = new Date(sec * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function parseBookmarkList(data: unknown): WereadHighlightEntry[] {
  if (!data || typeof data !== 'object') return [];
  const updated = (data as { updated?: unknown[] }).updated;
  if (!Array.isArray(updated)) return [];
  const out: WereadHighlightEntry[] = [];
  const seen = new Set<string>();
  for (const row of updated) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const text = String(r.markText ?? '').trim();
    if (text.length < 2) continue;
    const key = text.slice(0, 200);
    if (seen.has(key)) continue;
    seen.add(key);
    const t = r.createTime ?? r.updateTime ?? r.time;
    out.push({
      text,
      time: formatApiTime(typeof t === 'number' ? t : Number(t) || 0),
    });
  }
  return out;
}

/**
 * 拉取「有笔记的书」及每本书的划线，合并去重。
 * 仅在开发服务器（Vite 代理）下可用；GitHub Pages 会因 CORS 无法直连。
 */
export async function fetchWereadImports(): Promise<{
  payloads: WeradImportPayload[];
  bookCount: number;
  markCount: number;
}> {
  if (!isWereadApiAvailable()) {
    throw new Error(
      '当前为静态部署环境，浏览器无法直连微信读书接口。请在电脑运行 npm run dev 后在本页导入，或使用「导入笔记」粘贴导出内容。'
    );
  }

  await touchOrigin();

  const nbRes = await fetchWeread(iUrl('/user/notebooks'));
  if (!nbRes.ok) {
    throw new Error(`书架请求失败 (${nbRes.status})，请检查 Cookie 是否过期`);
  }
  const nbJson = (await nbRes.json()) as {
    books?: Array<{ book?: { bookId?: string; title?: string; author?: string } }>;
  };
  const books = nbJson.books ?? [];
  const payloads: WereadImportPayload[] = [];
  let markCount = 0;

  for (const wrap of books) {
    const book = wrap.book;
    if (!book?.bookId) continue;
    const bookId = String(book.bookId);
    const blRes = await fetchWeread(iUrl(`/book/bookmarklist?bookId=${encodeURIComponent(bookId)}`));
    if (!blRes.ok) continue;
    let blJson: unknown;
    try {
      blJson = await blRes.json();
    } catch {
      continue;
    }
    const highlights = parseBookmarkList(blJson);
    if (highlights.length === 0) continue;
    markCount += highlights.length;
    payloads.push({
      bookId,
      title: String(book.title ?? '未知书名'),
      author: String(book.author ?? ''),
      highlights,
    });
    await new Promise((r) => setTimeout(r, 180));
  }

  return { payloads, bookCount: payloads.length, markCount };
}

/**
 * 拉取微信读书书架书目（书名、作者、阅读状态）。
 * 不包含划线笔记，仅用于同步「读了什么书」到 Library。
 * 仅在开发环境（Vite 代理）下可用。
 */
export async function fetchWereadBookshelf(): Promise<{
  books: WereadBookPayload[];
  total: number;
}> {
  if (!isWereadApiAvailable()) {
    throw new Error(
      '当前为静态部署环境，浏览器无法直连微信读书接口。请在本机运行 npm run dev 后操作。'
    );
  }

  await touchOrigin();

  const nbRes = await fetchWeread(iUrl('/user/notebooks'));
  if (!nbRes.ok) {
    throw new Error(`书架请求失败 (${nbRes.status})，请检查 Cookie 是否过期`);
  }
  const nbJson = (await nbRes.json()) as {
    books?: Array<{
      book?: { bookId?: string; title?: string; author?: string; cover?: string };
      /** 阅读状态：1-在读 2-读完 3-想读 4-暂停 */
      type?: number;
    }>;
  };

  const rawBooks = nbJson.books ?? [];
  const books: WereadBookPayload[] = [];
  const seenIds = new Set<string>();

  for (const wrap of rawBooks) {
    const b = wrap.book;
    if (!b?.bookId) continue;
    const bookId = String(b.bookId);
    if (seenIds.has(bookId)) continue;
    seenIds.add(bookId);
    const rs = wrap.type ?? 1;
    if (rs < 1 || rs > 4) continue; // 跳过未知状态
    books.push({
      bookId,
      title: String(b.title ?? '未知书名'),
      author: String(b.author ?? ''),
      readStatus: rs as 1 | 2 | 3 | 4,
      cover: b.cover,
    });
  }

  return { books, total: books.length };
}
