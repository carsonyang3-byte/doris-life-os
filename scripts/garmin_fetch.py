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

    # 上传到 Supabase（如果配置了）
    if SUPABASE_URL and SUPABASE_KEY:
        upload_to_supabase(out)
    else:
        print("未配置 Supabase，跳过上传")


def upload_to_supabase(data):
    base = f"{SUPABASE_URL}/rest/v1"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    payload = {
        "key": STORAGE_KEY,
        "value": json.dumps(data, ensure_ascii=False),
        "updated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
    }
    url = f"{base}/{SUPABASE_TABLE}?key=eq.{STORAGE_KEY}"
    resp = requests.put(url, headers=headers, json=payload, timeout=20)
    # 200/201/204 都算成功（204 = 无响应体但合并成功）
    if resp.status_code in (200, 201, 204):
        print(f"已上传到 Supabase key={STORAGE_KEY} (status {resp.status_code})")
        return
    print(f"PUT 失败 ({resp.status_code})，尝试 POST")
    resp = requests.post(f"{base}/{SUPABASE_TABLE}", headers=headers, json=payload, timeout=20)
    resp.raise_for_status()
    print(f"已上传到 Supabase key={STORAGE_KEY}")


if __name__ == "__main__":
    main()
