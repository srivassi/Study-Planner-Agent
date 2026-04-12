from datetime import date, timedelta
from collections import defaultdict
from typing import List, Dict, Optional


def _parse_date(d) -> date:
    if isinstance(d, date):
        return d
    return date.fromisoformat(str(d)[:10])


def _available_days(start: date, end_exclusive: date, disrupted: set) -> List[date]:
    """Return non-disrupted days in [start, end_exclusive)."""
    days = []
    d = start
    while d < end_exclusive:
        if d not in disrupted:
            days.append(d)
        d += timedelta(days=1)
    return days


def generate_schedule(
    tasks: List[Dict],
    exam_date: date,
    daily_study_hours: int,
    pomodoro_minutes: int,
    disruptions: List[Dict],
    start_date: date = None,
    sessions_per_day: int = None,
    session_duration_minutes: int = None,
    preserve_order: bool = False,
) -> List[Dict]:
    """
    Single-course scheduler. Assigns each task a scheduled_date and order_index.
    Leaves a 1-day buffer before the exam. Respects disruptions.
    """
    if start_date is None:
        start_date = date.today()

    disrupted_dates = _build_disrupted_set(disruptions)
    pomodoros_per_day = _calc_pomodoros_per_day(
        daily_study_hours, pomodoro_minutes, sessions_per_day, session_duration_minutes
    )

    exam_buffer = exam_date - timedelta(days=1)
    available = _available_days(start_date, exam_buffer, disrupted_dates)

    priority_order = {"high": 0, "medium": 1, "low": 2}
    sorted_tasks = tasks if preserve_order else sorted(
        tasks, key=lambda t: priority_order.get(t.get("priority", "medium"), 1)
    )

    return _pack_tasks(sorted_tasks, available, pomodoros_per_day)


def generate_schedule_multi_course(
    tasks_by_course: Dict[str, List[Dict]],   # course_id → tasks (each has _exam_date)
    course_map: Dict[str, Dict],               # course_id → course row
    daily_study_hours: int,
    pomodoro_minutes: int,
    disruptions: List[Dict],
    start_date: date = None,
    sessions_per_day: int = None,
    session_duration_minutes: int = None,
    tasks_per_day_override: Dict[str, int] = None,   # course_id → forced tasks/day
) -> List[Dict]:
    """
    Deadline-aware multi-course scheduler.

    For each course it:
    1. Computes available days until that course's exam.
    2. Calculates whether tasks fit; if not, auto-increases density.
    3. Schedules independently.

    After scheduling each course it merges the per-course schedules back into
    a single interleaved list, preserving per-day ordering by exam proximity.
    """
    if start_date is None:
        start_date = date.today()

    disrupted_dates = _build_disrupted_set(disruptions)
    base_ppd = _calc_pomodoros_per_day(
        daily_study_hours, pomodoro_minutes, sessions_per_day, session_duration_minutes
    )

    # Step 1 — schedule each course against its own exam deadline
    # Result: date → list[(course_urgency_score, task)]
    day_slots: Dict[date, List] = defaultdict(list)

    sorted_courses = sorted(
        tasks_by_course.keys(),
        key=lambda cid: course_map.get(cid, {}).get("exam_date", "9999-99-99")
    )

    for cid in sorted_courses:
        tasks = tasks_by_course[cid]
        if not tasks:
            continue

        exam_date = _parse_date(course_map[cid]["exam_date"])
        exam_buffer = exam_date - timedelta(days=1)
        available = _available_days(start_date, exam_buffer, disrupted_dates)

        if not available:
            # Exam already past or today — pile onto today
            available = [start_date]

        # How many tasks/day do we need to cover all tasks before the exam?
        required_ppd = max(base_ppd, -(-len(tasks) // max(len(available), 1)))  # ceiling div
        # Cap at a sensible max to avoid unrealistic pile-ons (12 tasks/day max)
        ppd = min(required_ppd, 12)

        if tasks_per_day_override and cid in tasks_per_day_override:
            ppd = tasks_per_day_override[cid]

        days_to_exam = (exam_date - start_date).days
        urgency = 1.0 / max(days_to_exam, 1)   # higher = more urgent

        per_course = _pack_tasks(tasks, available, ppd)
        for t in per_course:
            d = _parse_date(t["scheduled_date"])
            day_slots[d].append((urgency, t))

    # Step 2 — merge: within each day sort by urgency desc (soonest exam first),
    # then re-assign order_index
    result = []
    for d in sorted(day_slots.keys()):
        slots = day_slots[d]
        slots.sort(key=lambda x: -x[0])   # most urgent first within the day
        for idx, (_, task) in enumerate(slots):
            task["order_index"] = idx
            result.append(task)

    return result


def course_capacity_report(
    tasks_by_course: Dict[str, List[Dict]],
    course_map: Dict[str, Dict],
    disruptions: List[Dict],
    start_date: date,
    base_ppd: int,
) -> List[Dict]:
    """
    Returns a per-course summary used to build the Claude prompt.
    Each entry: course_name, exam_date, days_remaining, available_study_days,
                task_count, capacity_at_base_ppd, tasks_per_day_needed, is_tight, is_overflowing
    """
    disrupted_dates = _build_disrupted_set(disruptions)
    report = []

    for cid, tasks in tasks_by_course.items():
        course = course_map.get(cid, {})
        exam_date = _parse_date(course["exam_date"])
        exam_buffer = exam_date - timedelta(days=1)
        available = _available_days(start_date, exam_buffer, disrupted_dates)
        n_days = len(available)
        capacity = n_days * base_ppd
        needed_ppd = (-(-len(tasks) // max(n_days, 1))) if n_days > 0 else len(tasks)
        days_remaining = (exam_date - start_date).days

        report.append({
            "course_id": cid,
            "course_name": course.get("title", cid),
            "exam_date": exam_date.isoformat(),
            "days_remaining": days_remaining,
            "available_study_days": n_days,
            "task_count": len(tasks),
            "capacity_at_base_ppd": capacity,
            "tasks_per_day_needed": needed_ppd,
            "is_tight": needed_ppd > base_ppd,
            "is_overflowing": needed_ppd > 12,
        })

    report.sort(key=lambda r: r["days_remaining"])
    return report


def reschedule_remaining(
    tasks: List[Dict],
    completed_task_ids: List[str],
    exam_date: date,
    daily_study_hours: int,
    pomodoro_minutes: int,
    disruptions: List[Dict],
) -> List[Dict]:
    """
    Redistributes overdue/remaining tasks starting from tomorrow.
    Completed tasks are untouched.
    """
    today = date.today()
    completed_ids_set = set(completed_task_ids)

    done_tasks = [t for t in tasks if t["id"] in completed_ids_set or t["status"] == "done"]
    overdue = [
        t for t in tasks
        if t["id"] not in completed_ids_set
        and t["status"] != "done"
        and t.get("scheduled_date")
        and _parse_date(t["scheduled_date"]) <= today
    ]
    future_tasks = [
        t for t in tasks
        if t["id"] not in completed_ids_set
        and t["status"] != "done"
        and t.get("scheduled_date")
        and _parse_date(t["scheduled_date"]) > today
    ]

    if not overdue:
        return tasks

    rescheduled = generate_schedule(
        tasks=overdue,
        exam_date=exam_date,
        daily_study_hours=daily_study_hours,
        pomodoro_minutes=pomodoro_minutes,
        disruptions=disruptions,
        start_date=today + timedelta(days=1),
    )

    return done_tasks + rescheduled + future_tasks


# ─── Internal helpers ────────────────────────────────────────

def _build_disrupted_set(disruptions: List[Dict]) -> set:
    disrupted = set()
    for d in disruptions:
        s = _parse_date(d["start_date"])
        e = _parse_date(d["end_date"])
        cur = s
        while cur <= e:
            disrupted.add(cur)
            cur += timedelta(days=1)
    return disrupted


def _calc_pomodoros_per_day(
    daily_study_hours: int,
    pomodoro_minutes: int,
    sessions_per_day: Optional[int],
    session_duration_minutes: Optional[int],
) -> int:
    if sessions_per_day and session_duration_minutes:
        tasks_per_session = max(1, session_duration_minutes // pomodoro_minutes)
        return sessions_per_day * tasks_per_session
    return max(1, (daily_study_hours * 60) // pomodoro_minutes)


def _pack_tasks(tasks: List[Dict], available_days: List[date], pomodoros_per_day: int) -> List[Dict]:
    """Assign scheduled_date + order_index sequentially into available_days."""
    scheduled = []
    day_idx = 0
    slot_in_day = 0

    for task in tasks:
        if day_idx >= len(available_days):
            day_idx = len(available_days) - 1

        scheduled.append({
            **task,
            "scheduled_date": available_days[day_idx].isoformat() if available_days else date.today().isoformat(),
            "order_index": slot_in_day,
        })

        slot_in_day += 1
        if slot_in_day >= pomodoros_per_day:
            slot_in_day = 0
            day_idx += 1

    return scheduled
