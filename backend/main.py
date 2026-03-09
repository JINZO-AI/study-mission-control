from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import math

app = FastAPI(title="Study Mission Control API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────────
class Subject(BaseModel):
    id: str
    name: str
    coeff: float
    hasDS: bool
    hasCC: bool
    hasExam: bool
    chapters: int
    chaptersCompleted: int
    difficulty: str  # easy | medium | hard | very_hard
    confidence: str  # expert | good | neutral | weak | lost
    dsGrade: Optional[float] = None
    ccGrade: Optional[float] = None
    examGrade: Optional[float] = None
    hoursStudied: float = 0

class Schedule(BaseModel):
    mon: float; tue: float; wed: float; thu: float
    fri: float; sat: float; sun: float

class ForecastRequest(BaseModel):
    subjects: List[Subject]
    schedule: Schedule
    target: float

class SimulateRequest(BaseModel):
    subjects: List[Subject]
    target: float

# ── Constants ───────────────────────────────────────────────
DIFF_MULT = {"easy": 0.60, "medium": 1.00, "hard": 1.45, "very_hard": 1.90}
CONF_MULT = {"expert": 0.50, "good": 0.75, "neutral": 1.00, "weak": 1.35, "lost": 1.80}

KEY_DATES = {
    "ds_start": "2026-03-30",
    "ds_end": "2026-04-04",
    "revision_start": "2026-05-18",
    "finals_start": "2026-05-21",
    "finals_end": "2026-05-30",
}

# ── Helpers ─────────────────────────────────────────────────
def calc_grade(s: Subject) -> Optional[float]:
    ds, cc, exam = s.dsGrade, s.ccGrade, s.examGrade
    if s.hasDS and s.hasCC:
        ws, wt = 0, 0
        if ds is not None: ws += ds; wt += 1
        if cc is not None: ws += cc; wt += 1
        if exam is not None: ws += exam * 2; wt += 2
        return ws / wt if wt > 0 else None
    elif s.hasCC:
        ws, wt = 0, 0
        if cc is not None: ws += cc; wt += 1
        if exam is not None: ws += exam * 2; wt += 2
        return ws / wt if wt > 0 else None
    return exam

def calc_hours_needed(s: Subject) -> float:
    diff = DIFF_MULT.get(s.difficulty, 1.0)
    conf = CONF_MULT.get(s.confidence, 1.0)
    remaining = max(0, s.chapters - s.chaptersCompleted)
    return remaining * 2.5 * diff * conf

def calc_required_exam(s: Subject, target: float) -> float:
    ds = s.dsGrade if s.dsGrade is not None else target
    cc = s.ccGrade if s.ccGrade is not None else target
    if s.hasDS and s.hasCC:
        return (4 * target - ds - cc) / 2
    if s.hasCC:
        return (3 * target - cc) / 2
    return target

def weighted_avg(subjects: List[Subject]) -> Optional[float]:
    ws, wt = 0, 0
    for s in subjects:
        g = calc_grade(s)
        if g is not None:
            ws += g * s.coeff
            wt += s.coeff
    return ws / wt if wt > 0 else None

def priority_score(s: Subject, target: float) -> float:
    g = calc_grade(s)
    current = g if g is not None else 0
    gap = max(0, target - current)
    return gap * s.coeff * CONF_MULT.get(s.confidence, 1.0)

# ── Routes ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "app": "Study Mission Control API"}

@app.get("/api/dates")
def get_dates():
    return KEY_DATES

@app.post("/api/forecast")
def forecast(req: ForecastRequest):
    """
    Returns full study forecast:
    - hours needed per subject
    - priority ranking
    - weighted average projection
    - required exam scores
    - hours balance
    """
    from datetime import date
    today = date.today()
    finals = date(2026, 5, 21)
    days_left = max(0, (finals - today).days)
    weekly_hrs = sum([req.schedule.mon, req.schedule.tue, req.schedule.wed,
                      req.schedule.thu, req.schedule.fri, req.schedule.sat, req.schedule.sun])
    total_available = round(weekly_hrs / 7 * days_left)

    subject_analysis = []
    for s in req.subjects:
        hrs = calc_hours_needed(s)
        req_exam = calc_required_exam(s, req.target)
        p = priority_score(s, req.target)
        current_g = calc_grade(s)
        subject_analysis.append({
            "id": s.id,
            "name": s.name,
            "coeff": s.coeff,
            "hoursNeeded": round(hrs, 1),
            "hoursStudied": s.hoursStudied,
            "requiredExamScore": round(req_exam, 2),
            "requiredExamFeasible": req_exam <= 20,
            "requiredExamSecured": req_exam < 0,
            "currentGrade": round(current_g, 2) if current_g is not None else None,
            "priorityScore": round(p, 2),
            "chaptersRemaining": max(0, s.chapters - s.chaptersCompleted),
        })

    # sort by priority
    subject_analysis.sort(key=lambda x: x["priorityScore"], reverse=True)

    total_hours_needed = sum(x["hoursNeeded"] for x in subject_analysis)
    daily_needed = total_hours_needed / days_left if days_left > 0 else 0

    # projected average (use target for ungraded subjects)
    ws, wt = 0, 0
    for s in req.subjects:
        g = calc_grade(s)
        ws += (g if g is not None else req.target) * s.coeff
        wt += s.coeff
    projected_avg = ws / wt if wt > 0 else 0

    current_avg = weighted_avg(req.subjects)

    return {
        "daysToDS": max(0, (date(2026, 3, 30) - today).days),
        "daysToFinals": days_left,
        "daysToRevision": max(0, (date(2026, 5, 18) - today).days),
        "totalHoursNeeded": round(total_hours_needed, 1),
        "totalHoursAvailable": total_available,
        "hoursBalance": round(total_available - total_hours_needed, 1),
        "dailyHoursNeeded": round(daily_needed, 2),
        "weeklyHours": weekly_hrs,
        "projectedAverage": round(projected_avg, 2),
        "currentAverage": round(current_avg, 2) if current_avg is not None else None,
        "onTarget": projected_avg >= req.target,
        "subjects": subject_analysis,
    }

@app.post("/api/simulate")
def simulate(req: SimulateRequest):
    """Simulate weighted average from provided grades."""
    avg = weighted_avg(req.subjects)
    ws, wt = 0, 0
    for s in req.subjects:
        g = calc_grade(s)
        if g is not None:
            ws += g * s.coeff; wt += s.coeff
    current = ws / wt if wt > 0 else None
    return {
        "simulatedAverage": round(current, 2) if current is not None else None,
        "onTarget": (current or 0) >= req.target,
        "gap": round((current or 0) - req.target, 2),
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}
