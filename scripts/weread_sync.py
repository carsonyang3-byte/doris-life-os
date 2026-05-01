#!/usr/bin/env python3
"""
微信读书 → Supabase 书架同步脚本

功能：从微信读书拉取书架书目数据，合并写入 Supabase app_data 表
用途：供 LIFE OS 前端读取（不依赖浏览器 Cookie，服务器端运行）

运行方式：
  - GitHub Actions 定时任务（每天自动）
  - 手动：WEREAD_COOKIE="xxx" SUPABASE_URL="xxx" SUPABASE_KEY="xxx" python scripts/weread_sync.py
"""

import os
import json
import time
import logging
from datetime import datetime, timezone
from typing import Optional

import requests

# ── 日志 ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("weread-sync")

# ── 常量 ──
WEREAD_HOME = "https://weread.qq.com/"
API_NOTEBOOK = "https://weread.qq.com/api/user/notebook"
SUPABASE_TABLE = "app_data"
STORAGE_KEY = "doris_library"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# ── 微信读书状态映射 ──
# type: 1-在读 2-读完 3-想读 4-暂停
WEREAD_STATUS_MAP = {1: "reading", 2: "completed", 3: "reading", 4: "abandoned"}


def parse_cookie(cookie_str: str) -> dict:
    """将 Cookie 字符串解析为字典"""
    result = {}
    for item in cookie_str.split(";"):
        item = item.strip()
        if "=" in item:
            key, value = item.split("=", 1)
            result[key.strip()] = value.strip()
    return result


def get_env_or_raise(name: str) -> str:
    """获取环境变量，缺失则抛出异常"""
    val = os.environ.get(name)
    if not val:
        raise ValueError(f"缺少环境变量: {name}")
    return val


# ══════════════════════════════════════════
#  微信读书 API
# ══════════════════════════════════════════

class WereadClient:
    """微信读书 API 客户端"""

    def __init__(self, cookie_str: str):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": USER_AGENT})
        # 设置 Cookie
        for k, v in parse_cookie(cookie_str).items():
            self.session.cookies.set(k, v, domain="weread.qq.com")

    def warmup(self):
        """预热会话（每次 API 调用前必做）"""
        self.session.get(WEREAD_HOME, timeout=15)

    def get_notebooks(self, retries: int = 3) -> list:
        """获取书架书目列表，带重试"""
        for attempt in range(retries):
            try:
                self.warmup()
                resp = self.session.get(API_NOTEBOOK, timeout=15)
                if resp.status_code == 401:
                    logger.warning(f"Cookie 鉴权失败 (401)，第 {attempt+1} 次重试...")
                    time.sleep(3)
                    continue
                resp.raise_for_status()
                data = resp.json()
                books = data.get("books", [])
                logger.info(f"书架获取成功: {len(books)} 本书")
                return books
            except requests.RequestException as e:
                logger.warning(f"请求失败 (第 {attempt+1}/{retries} 次): {e}")
                time.sleep(3)
        raise RuntimeError("获取书架失败，已重试 3 次")

    def get_read_info(self, book_id: str) -> Optional[dict]:
        """获取一本书的阅读信息"""
        try:
            self.warmup()
            url = f"https://weread.qq.com/web/book/readinfo?bookId={book_id}"
            resp = self.session.get(url, timeout=10)
            if resp.ok:
                return resp.json()
        except Exception as e:
            logger.debug(f"获取阅读信息失败 {book_id}: {e}")
        return None


# ══════════════════════════════════════════
#  Supabase 读写
# ══════════════════════════════════════════

class SupabaseClient:
    """Supabase REST API 客户端"""

    def __init__(self, url: str, key: str):
        self.base = f"{url}/rest/v1"
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def fetch_data(self) -> list:
        """获取现有 Library 数据"""
        url = f"{self.base}/{SUPABASE_TABLE}?key=eq.{STORAGE_KEY}&select=value"
        resp = requests.get(url, headers=self.headers, timeout=15)
        if resp.status_code == 200:
            rows = resp.json()
            if rows:
                return json.loads(rows[0]["value"])
        return []

    def upsert_data(self, data: list):
        """写入 Library 数据（upsert）"""
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "key": STORAGE_KEY,
            "value": json.dumps(data, ensure_ascii=False),
            "updated_at": now,
        }
        # 先尝试 PUT（upsert）
        put_url = f"{self.base}/{SUPABASE_TABLE}?key=eq.{STORAGE_KEY}"
        headers = {**self.headers, "Prefer": "resolution=merge-duplicates"}
        resp = requests.put(put_url, headers=headers, json=payload, timeout=15)
        if resp.status_code not in (200, 201):
            logger.warning(f"PUT 失败 ({resp.status_code})，尝试 POST...")
            resp = requests.post(self.base + "/" + SUPABASE_TABLE, 
                                 headers=headers, json=payload, timeout=15)
            resp.raise_for_status()
        logger.info(f"数据写入成功: {len(data)} 条记录")


# ══════════════════════════════════════════
#  数据合并
# ══════════════════════════════════════════

def merge_books(weread_books: list, existing_items: list) -> list:
    """将微信读书书目合并到现有 Library 数据中"""
    # 构建 wereadBookId → item 索引
    existing_by_id = {}
    for item in existing_items:
        bid = item.get("wereadBookId")
        if bid:
            existing_by_id[bid] = item

    today = datetime.now().strftime("%Y-%m-%d")
    # 不需要新建 ID 时用 existing 的最大 ID
    max_id = max((item["id"] for item in existing_items if item.get("id")), default=0)
    next_id = max_id + 1
    result = list(existing_items)
    new_count = 0
    update_count = 0

    for wrap in weread_books:
        book = wrap.get("book", {})
        book_id = str(book.get("bookId", ""))
        if not book_id:
            continue

        title = book.get("title", "").strip()
        if not title:
            continue

        author = book.get("author", "").strip() or ""
        weread_type = wrap.get("type", 1)
        status = WEREAD_STATUS_MAP.get(weread_type, "reading")

        if book_id in existing_by_id:
            # ── 更新已有记录 ──
            idx = next(
                i for i, item in enumerate(result)
                if item.get("wereadBookId") == book_id
            )
            cur = result[idx]
            # 如果已经是 completed 状态就不降级
            final_status = "completed" if cur.get("status") == "completed" else status
            result[idx] = {
                **cur,
                "creator": author or cur.get("creator", ""),
                "status": final_status,
                "finishedDate": (
                    today if status == "completed" and not cur.get("finishedDate")
                    else cur.get("finishedDate")
                ),
            }
            update_count += 1
        else:
            # ── 新建记录 ──
            result.insert(0, {
                "id": next_id,
                "type": "book",
                "title": title,
                "creator": author,
                "date": today,
                "rating": 0,
                "status": status,
                "wereadBookId": book_id,
                "finishedDate": today if status == "completed" else None,
            })
            next_id += 1
            new_count += 1

    logger.info(f"合并结果: {new_count} 本新书, {update_count} 本更新")
    return result


# ══════════════════════════════════════════
#  主流程
# ══════════════════════════════════════════

def main():
    logger.info("=" * 40)
    logger.info("微信读书同步开始")
    logger.info("=" * 40)

    # 1. 读取环境变量
    supabase_url = get_env_or_raise("SUPABASE_URL")
    supabase_key = get_env_or_raise("SUPABASE_KEY")
    weread_cookie = get_env_or_raise("WEREAD_COOKIE")

    # 2. 拉取微信读书书架
    logger.info("→ 拉取微信读书书架...")
    weread = WereadClient(weread_cookie)
    books = weread.get_notebooks()
    if not books:
        logger.info("书架为空，跳过同步")
        return

    # 3. 获取现有数据
    logger.info("→ 获取现有 Library 数据...")
    supabase = SupabaseClient(supabase_url, supabase_key)
    existing = supabase.fetch_data()
    logger.info(f"现有记录: {len(existing)} 条")

    # 4. 合并
    logger.info("→ 合并数据...")
    merged = merge_books(books, existing)

    # 5. 写回 Supabase
    logger.info("→ 写入 Supabase...")
    supabase.upsert_data(merged)

    logger.info("=" * 40)
    logger.info("同步完成 ✓")
    logger.info("=" * 40)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.error(f"同步失败: {e}")
        raise
