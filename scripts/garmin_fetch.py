#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Garmin 健康数据自动抓取脚本
每天由 GitHub Actions 定时运行，抓取 Doris 的佳明健康数据，
计算洞察/趋势/周期/目标，输出 health_data.json（结构对齐 HealthPage 前端）。

用法：
  GARMIN_EMAIL=xxx GARMIN_PASSWORD=xxx python garmin_fetch.py
输出：
  同目录 health_data.json
"""
import os
import sys
import json
import datetime as dt
from collections import defaultdict

import requests

EMAIL = os.environ.get("GARMIN_EMAIL")
PASSWORD = os.environ.get("GARMIN_PASSWORD")

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SUPABASE_TABLE = "app_data"
STORAGE_KEY = "garmin_health"
AI_STORAGE_KEY = "garmin_ai_insight"

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DEEPSEEK_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

if not EMAIL or not PASSWORD:
    print("错误：缺少 GARMIN_EMAIL / GARMIN_PASSWORD 环境变量")
    sys.exit(1)

from garminconnect import Garmin

def safe(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except Exception:
        return None

def main():
    api = Garmin(email=EMAIL, password=PASSWORD, is_cn=True)
    api.login()
    print("登录成功")

    today = dt.date.today()
    out = {
        "generatedAt": today.isoformat(),
        "generatedAtLabel": f"{today.month}月{today.day}日",
        "days": [],
        "activity": {},
        "runPace": [],
        "hrZone": [],
        "cycle": {},
        "symptoms": [],
        "goals": [],
    }

    # ===== 1. 抓取近 90 天每日数据 =====
    days = []
    for i in range(89, -1, -1):
        d = (today - dt.timedelta(days=i)).isoformat()
        day = {"date": d}
        # 静息心率
        rhr = safe(api.get_rhr_day, d)
        if rhr:
            vals = rhr.get("allMetrics", {}).get("metricsMap", {}).get("WELLNESS_RESTING_HEART_RATE", [])
            if vals:
                day["restingHR"] = vals[0].get("value")
        # 睡眠
        sl = safe(api.get_sleep_data, d)
        if sl:
            dto = sl.get("dailySleepDTO", {})
            if dto.get("sleepTimeSeconds"):
                day["sleepH"] = round(dto["sleepTimeSeconds"] / 3600, 1)
            sc = dto.get("sleepScores", {})
            if sc and sc.get("overall"):
                day["sleepScore"] = sc["overall"].get("value")
                day["deepPct"] = (sc.get("deepPercentage") or {}).get("value")
                day["remPct"] = (sc.get("remPercentage") or {}).get("value")
        # 压力
        st = safe(api.get_stress_data, d)
        if st and st.get("avgStressLevel") is not None:
            day["stress"] = st.get("avgStressLevel")
            day["maxStress"] = st.get("maxStressLevel")
        # 步数/卡路里/距离
        s = safe(api.get_stats, d)
        if s:
            if s.get("totalSteps") is not None:
                day["steps"] = s.get("totalSteps")
            if s.get("totalKilocalories") is not None:
                day["kcal"] = s.get("totalKilocalories")
            if s.get("totalDistanceMeters") is not None:
                day["distanceKm"] = round(s.get("totalDistanceMeters") / 1000, 1)
        days.append(day)
    out["days"] = days
    print(f"每日数据 {len(days)} 天")

    dmap = {d["date"]: d for d in days}

    # ===== 2. 活动统计（近 7/30/90 天） =====
    def act_stats(ndays):
        acts = safe(api.get_activities_by_date, (today - dt.timedelta(days=ndays)).isoformat(), today.isoformat(), "") or []
        bytype = defaultdict(lambda: {"n": 0, "dur": 0, "dist": 0, "kcal": 0, "hrs": []})
        for a in acts:
            t = a.get("activityType", {}).get("typeKey", "unknown")
            bytype[t]["n"] += 1
            bytype[t]["dur"] += a.get("duration") or 0
            bytype[t]["dist"] += a.get("distance") or 0
            bytype[t]["kcal"] += a.get("calories") or 0
            if a.get("averageHR"):
                bytype[t]["hrs"].append(a["averageHR"])
        result = {}
        for t, v in bytype.items():
            avg_hr = round(sum(v["hrs"]) / len(v["hrs"])) if v["hrs"] else None
            result[t] = {
                "n": v["n"],
                "durMin": round(v["dur"] / 60),
                "distKm": round(v["dist"] / 1000, 1),
                "kcal": round(v["kcal"]),
                "avgHR": avg_hr,
            }
        return {"total": len(acts), "bytype": result}

    out["activity"] = {
        "week": act_stats(7),
        "month": act_stats(30),
        "total": act_stats(90),
    }
    print("活动统计完成")

    # ===== 3. 跑步配速趋势（近 90 天） =====
    acts90 = safe(api.get_activities_by_date, (today - dt.timedelta(days=90)).isoformat(), today.isoformat(), "") or []
    runs = [a for a in acts90 if a.get("activityType", {}).get("typeKey") == "running"]
    run_pace = []
    for a in sorted(runs, key=lambda x: x.get("startTimeLocal", "")):
        d = (a.get("startTimeLocal") or "")[:10]
        dist = (a.get("distance") or 0) / 1000
        dur = (a.get("duration") or 0) / 60
        if dist > 0 and dur > 0:
            pace = round(dur / dist, 1)
            run_pace.append({"d": d[5:], "v": pace})
    out["runPace"] = run_pace
    print(f"跑步配速 {len(run_pace)} 条")

    # ===== 4. 身体年龄 / VO2max =====
    fa = safe(api.get_fitness_age_details)
    if fa:
        out["fitnessAge"] = fa.get("fitnessAge")
        out["chronoAge"] = fa.get("chronologicalAge")
    ts = safe(api.get_training_status, today.isoformat())
    out["vo2max"] = (ts or {}).get("mostRecentVO2Max") or None
    print(f"身体年龄 {out.get('fitnessAge')} / VO2max {out.get('vo2max')}")

    # ===== 5. 经期周期 =====
    cal = safe(api.get_menstrual_calendar_data, (today - dt.timedelta(days=88)).isoformat(), today.isoformat())
    periods = []
    if cal and cal.get("cycleSummaries"):
        periods = [c.get("startDate") for c in cal["cycleSummaries"] if c.get("startDate")]
        periods.sort()
    cycle = {"periods": periods}
    if periods:
        last = dt.date.fromisoformat(periods[-1])
        cycle["lastPeriod"] = periods[-1]
        if len(periods) >= 2:
            cycle["cycleLen"] = (last - dt.date.fromisoformat(periods[-2])).days
        else:
            cycle["cycleLen"] = 28
        cycle["cycleDay"] = (today - last).days + 1
        cycle["nextPeriod"] = (last + dt.timedelta(days=cycle["cycleLen"])).isoformat()
        cd = cycle["cycleDay"]
        if 1 <= cd <= 5:
            cycle["phase"] = "经期"
        elif 6 <= cd <= 14:
            cycle["phase"] = "卵泡期"
        elif 15 <= cd <= 17:
            cycle["phase"] = "排卵期"
        else:
            cycle["phase"] = "黄体期"
    out["cycle"] = cycle
    print(f"经期 {periods} 今天周期第 {cycle.get('cycleDay')} 天 {cycle.get('phase')}")

    # ===== 6. 症状统计 =====
    symptom_days = (cal or {}).get("loggedSymptomDays", [])
    zh = {
        "BACKACHE": "背痛", "DIARRHEA": "腹泻", "FATIGUE": "疲劳", "TENDER_BREASTS": "乳房胀痛",
        "WEIGHT_GAIN": "体重增加", "FREQUENT_URINATION": "尿频", "INSOMNIA": "失眠", "BLOATING": "腹胀",
    }
    sc = defaultdict(int)
    for d in symptom_days:
        r = safe(api.get_menstrual_data_for_date, d)
        dl = (r or {}).get("dayLog") or {}
        for s in (dl.get("symptoms") or []):
            sc[zh.get(s, s)] += 1
    out["symptoms"] = [{"name": k, "count": v} for k, v in sorted(sc.items(), key=lambda x: -x[1])]
    out["symptomDays"] = len(symptom_days)
    print(f"症状 {out['symptomDays']} 天")

    # ===== 7. 目标进度 =====
    # 近30天数据算目标
    month_days = [d for d in days if d["date"] >= (today - dt.timedelta(days=30)).isoformat()]
    def avg(key):
        vals = [d[key] for d in month_days if d.get(key) is not None]
        return round(sum(vals) / len(vals)) if vals else 0
    avg_steps = avg("steps")
    am = out["activity"]["month"]["bytype"]
    strength_wk = round(am.get("strength_training", {}).get("n", am.get("strength", {}).get("n", 0)) / 4.3, 1)
    run_wk = round(am.get("running", {}).get("n", 0) / 4.3, 1)
    goals = [
        {"name": "每日步数 ≥ 10,000", "pct": min(100, round(avg_steps / 10000 * 100)), "note": f"近30天平均 {avg_steps:,}"},
        {"name": "每周力量训练 ≥ 3 次", "pct": min(100, round(strength_wk / 3 * 100)), "note": f"当前约 {strength_wk} 次/周"},
        {"name": "每周跑步 ≥ 2 次", "pct": min(100, round(run_wk / 2 * 100)), "note": f"当前约 {run_wk} 次/周"},
    ]
    out["goals"] = goals
    print("目标进度完成")

    # 写文件
    with open("health_data.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("已输出 health_data.json")

    # ===== 8. AI 洞察（真 LLM 交叉分析）=====
    if DEEPSEEK_API_KEY:
        ai = generate_ai_insight(out)
        if ai:
            # 与健康数据一起上传（也单独存一份，前端直接读）
            if SUPABASE_URL and SUPABASE_KEY:
                upload_to_supabase(ai, key=AI_STORAGE_KEY)
            with open("ai_insight.json", "w", encoding="utf-8") as f:
                json.dump(ai, f, ensure_ascii=False, indent=2)
            print("AI 洞察已生成")
    else:
        print("未配置 DEEPSEEK_API_KEY，跳过 AI 洞察")

    # 上传到 Supabase（如果配置了）
    if SUPABASE_URL and SUPABASE_KEY:
        upload_to_supabase(out)
    else:
        print("未配置 Supabase，跳过上传")


def upload_to_supabase(data, key=STORAGE_KEY):
    base = f"{SUPABASE_URL}/rest/v1"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    payload = {
        "key": key,
        "value": json.dumps(data, ensure_ascii=False),
        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    url = f"{base}/{SUPABASE_TABLE}?key=eq.{key}"
    resp = requests.put(url, headers=headers, json=payload, timeout=20)
    # 200/201/204 都算成功（204 = 无响应体但合并成功）
    if resp.status_code in (200, 201, 204):
        print(f"已上传到 Supabase key={key} (status {resp.status_code})")
        return
    print(f"PUT 失败 ({resp.status_code})，尝试 POST")
    resp = requests.post(f"{base}/{SUPABASE_TABLE}", headers=headers, json=payload, timeout=20)
    resp.raise_for_status()
    print(f"已上传到 Supabase key={key}")


def generate_ai_insight(data):
    """
    把 90 天健康数据 + 经期 + 症状拼成上下文，调用 DeepSeek 出真 AI 洞察。
    返回 {"generatedAt": ..., "content": ...}，失败返回 None。
    """
    today = dt.date.today()
    days = data.get("days", [])
    # 近 7 天 / 近 30 天汇总
    def recent(n):
        return [d for d in days if d.get("date", "") >= (today - dt.timedelta(days=n)).isoformat()]

    d7 = recent(7)
    d30 = recent(30)

    def avg(key, arr):
        vals = [d[key] for d in arr if d.get(key) is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    # 构造结构化摘要
    summary = {
        "今天": days[-1] if days else {},
        "近7天平均": {
            "静息心率": avg("restingHR", d7),
            "睡眠小时": avg("sleepH", d7),
            "睡眠评分": avg("sleepScore", d7),
            "压力": avg("stress", d7),
            "步数": avg("steps", d7),
        },
        "近30天平均": {
            "静息心率": avg("restingHR", d30),
            "睡眠小时": avg("sleepH", d30),
            "睡眠评分": avg("sleepScore", d30),
            "压力": avg("stress", d30),
            "步数": avg("steps", d30),
        },
        "活动统计": data.get("activity", {}),
        "跑步配速趋势": data.get("runPace", []),
        "身体年龄": data.get("fitnessAge"),
        "实际年龄": data.get("chronoAge"),
        "VO2max": data.get("vo2max"),
        "经期周期": data.get("cycle", {}),
        "症状统计": data.get("symptoms", []),
        "症状记录天数": data.get("symptomDays", 0),
        "目标进度": data.get("goals", []),
    }

    prompt = f"""你是一位懂运动生理、睡眠、女性激素周期与恢复的私人健康教练。下面是用户（女性，44岁）最近 90 天 Garmin 手表的真实健康数据摘要。

请基于这些数据做**跨指标交叉分析**，重点把以下维度联系起来看：
1. 睡眠质量 / 静息心率 / 压力 与 训练量（跑步、力量）的关系
2. 经期阶段（卵泡期/排卵期/黄体期/经期）与睡眠、心率、训练表现、症状的关联
3. 跑步配速的进步或停滞，以及身体年龄 / VO2max 反映的心肺状态
4. 症状（背痛、疲劳、失眠等）出现的时机与周期的关系

不要泛泛而谈，不要罗列数据。要有真正的因果推断和可执行的建议。如果某点数据不足，直接说"数据还看不出明确模式"，不要硬编。

数据摘要（JSON）：
{json.dumps(summary, ensure_ascii=False, indent=1)}

输出要求：
- 用中文，口语化但有专业感，像一位真正了解她的教练在说话，不是 AI 报告腔。
- 禁止 emoji。
- 严格按下面 4 段输出，每段用「**标题**」开头，每段 80~160 字：

**今天的身体状态**
**这周的趋势**
**周期与身体的关联**
**接下来一周的建议**
"""

    try:
        resp = requests.post(
            DEEPSEEK_URL,
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 1200,
            },
            timeout=60,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"].strip()
        return {
            "generatedAt": today.isoformat(),
            "generatedAtLabel": f"{today.month}月{today.day}日",
            "content": content,
            "model": DEEPSEEK_MODEL,
        }
    except Exception as e:
        print(f"AI 洞察生成失败：{e}")
        return None


if __name__ == "__main__":
    main()
