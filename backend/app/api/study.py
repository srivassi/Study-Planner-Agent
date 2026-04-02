import os
import re
import json
import traceback
from collections import defaultdict
from datetime import date, datetime, timedelta
import anthropic as _anthropic
from fastapi import APIRouter, HTTPException
from app.core.supabase import get_supabase_client
from app.agent.scheduler import generate_schedule, reschedule_remaining, _parse_date
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/study")


class PomodoroStart(BaseModel):
    task_id: str
    user_id: str
    duration_minutes: int = 25


class PomodoroComplete(BaseModel):
    session_id: str
    notes: Optional[str] = None


class RescheduleRequest(BaseModel):
    course_id: str
    user_id: str
    completed_task_ids: List[str]
    exam_date: str          # ISO date
    daily_study_hours: int
    pomodoro_minutes: int = 25


class FullRescheduleRequest(BaseModel):
    user_id: str
    feedback: Optional[str] = None
    interleave_courses: bool = True          # cover all modules each day
    sessions_per_day_override: Optional[int] = None   # override profile value


# ─── Pomodoro ───────────────────────────────────────────────

@router.post("/pomodoro/start")
def start_pomodoro(body: PomodoroStart):
    supabase = get_supabase_client()

    # Mark task as in_progress
    supabase.table("tasks").update({"status": "in_progress"}).eq("id", body.task_id).execute()

    # Create session row
    result = supabase.table("pomodoro_sessions").insert({
        "task_id": body.task_id,
        "user_id": body.user_id,
        "duration_minutes": body.duration_minutes,
        "started_at": datetime.utcnow().isoformat(),
        "is_completed": False,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to start session")
    return result.data[0]


@router.post("/pomodoro/complete")
def complete_pomodoro(body: PomodoroComplete):
    supabase = get_supabase_client()

    update = {
        "is_completed": True,
        "completed_at": datetime.utcnow().isoformat(),
    }
    if body.notes:
        update["notes"] = body.notes

    result = supabase.table("pomodoro_sessions").update(update).eq("id", body.session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = result.data[0]

    # Mark task done
    supabase.table("tasks").update({
        "status": "done",
        "completed_at": datetime.utcnow().isoformat(),
    }).eq("id", session["task_id"]).execute()

    return session


@router.get("/pomodoro/sessions/{user_id}")
def get_sessions(user_id: str, limit: int = 50):
    supabase = get_supabase_client()
    result = (
        supabase.table("pomodoro_sessions")
        .select("*, tasks(title, course_id)")
        .eq("user_id", user_id)
        .order("started_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data


# ─── Today's plan ────────────────────────────────────────────

@router.get("/today/{user_id}")
def get_today_plan(user_id: str):
    supabase = get_supabase_client()
    today = date.today().isoformat()

    tasks_result = (
        supabase.table("tasks")
        .select("*, courses(title, color, exam_date)")
        .eq("user_id", user_id)
        .eq("scheduled_date", today)
        .order("order_index")
        .execute()
    )
    for t in (tasks_result.data or []):
        if t.get("courses"):
            t["courses"]["name"] = t["courses"].pop("title", "")

    sessions_result = (
        supabase.table("pomodoro_sessions")
        .select("*")
        .eq("user_id", user_id)
        .gte("started_at", f"{today}T00:00:00")
        .execute()
    )

    tasks = tasks_result.data or []
    sessions = sessions_result.data or []
    completed_today = sum(1 for s in sessions if s["is_completed"])

    return {
        "date": today,
        "tasks": tasks,
        "completed_pomodoros_today": completed_today,
        "total_tasks": len(tasks),
        "completed_tasks": sum(1 for t in tasks if t["status"] == "done"),
    }


# ─── Stats ───────────────────────────────────────────────────

@router.get("/stats/{user_id}")
def get_stats(user_id: str):
    supabase = get_supabase_client()

    sessions = (
        supabase.table("pomodoro_sessions")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_completed", True)
        .execute()
    ).data or []

    tasks_done = (
        supabase.table("tasks")
        .select("id, completed_at")
        .eq("user_id", user_id)
        .eq("status", "done")
        .execute()
    ).data or []

    total_focus_minutes = sum(s["duration_minutes"] for s in sessions)

    # Streak calculation
    completed_dates = sorted(set(
        s["completed_at"][:10] for s in sessions if s.get("completed_at")
    ), reverse=True)

    streak = 0
    check = date.today()
    for d_str in completed_dates:
        if _parse_date(d_str) == check:
            streak += 1
            check = check.__class__.fromordinal(check.toordinal() - 1)
        elif _parse_date(d_str) < check:
            break

    # Weekly pomodoros (last 7 days)
    weekly = []
    for i in range(6, -1, -1):
        day = (date.today() - timedelta(days=i)).isoformat()
        count = sum(1 for s in sessions if s.get("completed_at", "")[:10] == day)
        weekly.append({"date": day, "count": count})

    return {
        "tasks_completed": len(tasks_done),
        "total_focus_minutes": total_focus_minutes,
        "streak_days": streak,
        "weekly_pomodoros": weekly,
    }


# ─── Reschedule ──────────────────────────────────────────────

@router.post("/reschedule")
def reschedule(body: RescheduleRequest):
    supabase = get_supabase_client()

    # Fetch all tasks for course
    result = supabase.table("tasks").select("*").eq("course_id", body.course_id).execute()
    tasks = result.data or []

    # Fetch disruptions
    disruptions_result = supabase.table("disruptions").select("*").eq("user_id", body.user_id).execute()
    disruptions = disruptions_result.data or []

    updated = reschedule_remaining(
        tasks=tasks,
        completed_task_ids=body.completed_task_ids,
        exam_date=_parse_date(body.exam_date),
        daily_study_hours=body.daily_study_hours,
        pomodoro_minutes=body.pomodoro_minutes,
        disruptions=disruptions,
    )

    # Write updated scheduled_dates back to Supabase
    for t in updated:
        supabase.table("tasks").update({
            "scheduled_date": t.get("scheduled_date"),
            "order_index": t.get("order_index", 0),
        }).eq("id", t["id"]).execute()

    return {"rescheduled_count": len(updated), "tasks": updated}


@router.post("/full-reschedule")
def full_reschedule(body: FullRescheduleRequest):
    """Replans ALL remaining tasks across ALL courses in a shared daily pool."""
    supabase = get_supabase_client()
    disruptions = supabase.table("disruptions").select("*").eq("user_id", body.user_id).execute().data or []
    profile_rows = supabase.table("user_profiles").select("*").eq("id", body.user_id).limit(1).execute().data
    if not profile_rows:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = profile_rows[0]
    daily_hours = profile.get("daily_study_hours", 4)
    pomodoro_minutes = profile.get("pomodoro_work_minutes", 25)
    sessions_per_day = body.sessions_per_day_override or profile.get("sessions_per_day")
    session_duration_minutes = profile.get("session_duration_minutes")

    courses = supabase.table("courses").select("*").eq("user_id", body.user_id).execute().data or []
    course_map = {c["id"]: c for c in courses}

    # Collect ALL remaining tasks across courses, tagging each with its exam_date
    all_remaining = []
    for course in courses:
        if not course.get("exam_date"):
            continue
        tasks = supabase.table("tasks").select("*").eq("course_id", course["id"]).execute().data or []
        for t in tasks:
            if t.get("status") not in ("done", "completed"):
                t["_exam_date"] = course["exam_date"]
                all_remaining.append(t)

    if not all_remaining:
        return {"updated": 0}

    # Sort tasks and optionally interleave across courses so each day covers all modules.
    priority_order = {"high": 0, "medium": 1, "low": 2}
    by_course: dict = defaultdict(list)
    for t in all_remaining:
        by_course[t["course_id"]].append(t)
    # Sort each course's tasks by priority
    for lst in by_course.values():
        lst.sort(key=lambda t: priority_order.get(t.get("priority", "medium"), 1))

    if body.interleave_courses:
        # Round-robin across courses ordered by soonest exam
        sorted_courses = sorted(
            by_course.keys(),
            key=lambda cid: course_map.get(cid, {}).get("exam_date", "9999-99-99")
        )
        interleaved = []
        course_lists = [by_course[cid] for cid in sorted_courses]
        max_len = max((len(lst) for lst in course_lists), default=0)
        for i in range(max_len):
            for lst in course_lists:
                if i < len(lst):
                    interleaved.append(lst[i])
        all_remaining = interleaved
    else:
        # Sequential: finish one course before starting the next (soonest exam first)
        sorted_courses = sorted(
            by_course.keys(),
            key=lambda cid: course_map.get(cid, {}).get("exam_date", "9999-99-99")
        )
        all_remaining = [t for cid in sorted_courses for t in by_course[cid]]

    # Claude interprets feedback and returns scheduling directives + task order
    start_date = date.today()
    if body.feedback and body.feedback.strip():
        try:
            client = _anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
            task_summary = "\n".join(
                f"- [{t.get('priority','medium')}] {t['title']} ({t['estimated_minutes']}m, exam {t['_exam_date']})"
                for t in all_remaining[:80]  # cap to avoid token limits
            )
            prompt = f"""You are a study schedule assistant. Today's date: {date.today().isoformat()}. Current schedule settings:
- Sessions per day: {sessions_per_day or 'not set'}
- Session duration: {session_duration_minutes or 'not set'} minutes
- Pomodoro duration: {pomodoro_minutes} minutes
- Tasks per day (calculated): {(sessions_per_day or 1) * max(1, (session_duration_minutes or pomodoro_minutes) // pomodoro_minutes)}

User feedback: "{body.feedback}"

Tasks to schedule ({len(all_remaining)} total, showing first 80):
{task_summary}

Based on the feedback, return a JSON object with these fields:
- "sessions_per_day": integer or null (only set if user wants to change blocks per day)
- "session_duration_minutes": integer or null (only set if user wants to change session length)
- "start_date": ISO date string or null (only set if user wants scheduling to start from a specific date, e.g. "2026-04-03")
- "task_order": array of task titles in preferred order (reorder all {len(all_remaining)} tasks)

Return raw JSON only, no explanation. If feedback doesn't clearly request a change to a field, set it to null."""

            msg = client.messages.create(model="claude-opus-4-6", max_tokens=8000,
                                          messages=[{"role": "user", "content": prompt}])
            raw = msg.content[0].text.strip()
            obj_match = re.search(r'\{[\s\S]*\}', raw)
            if obj_match:
                directives = json.loads(obj_match.group(0))
                if directives.get("sessions_per_day"):
                    sessions_per_day = int(directives["sessions_per_day"])
                if directives.get("session_duration_minutes"):
                    session_duration_minutes = int(directives["session_duration_minutes"])
                if directives.get("start_date"):
                    start_date = _parse_date(directives["start_date"])
                ordered_titles = directives.get("task_order", [])
                if ordered_titles:
                    title_index = {title: i for i, title in enumerate(ordered_titles)}
                    all_remaining.sort(key=lambda t: title_index.get(t["title"], 999))
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Claude feedback error: {e}")

    # Use the earliest exam date as the scheduling horizon
    earliest_exam = min(_parse_date(c["exam_date"]) for c in courses if c.get("exam_date"))

    scheduled = generate_schedule(
        tasks=all_remaining,
        exam_date=earliest_exam,
        daily_study_hours=daily_hours,
        pomodoro_minutes=pomodoro_minutes,
        disruptions=disruptions,
        start_date=start_date,
        sessions_per_day=sessions_per_day,
        session_duration_minutes=session_duration_minutes,
        preserve_order=True,
    )

    for t in scheduled:
        supabase.table("tasks").update({
            "scheduled_date": t.get("scheduled_date"),
            "order_index": t.get("order_index", 0),
        }).eq("id", t["id"]).execute()

    return {"updated": len(scheduled)}
