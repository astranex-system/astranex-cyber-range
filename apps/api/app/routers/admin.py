import csv
import io
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Attempt, Submission, HintUsage, EventLog, IncidentReport, CodeSubmission, Stage, Challenge
from app.schemas import (
    AdminDashboardOut, CandidateSummaryOut, CandidateDetailOut, LeaderboardEntryOut,
    ReportReviewRequest, IncidentReportSchema
)
from app.security import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Management & Analytics"])

@router.get("/dashboard", response_model=AdminDashboardOut)
def get_admin_dashboard(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    candidates = db.query(User).filter(User.role == "candidate").all()
    total_cand = len(candidates)

    attempts = db.query(Attempt).all()
    active_cand = sum(1 for a in attempts if a.status == "IN_PROGRESS")
    completed_cand = sum(1 for a in attempts if a.status == "SUBMITTED")

    completed_attempts = [a for a in attempts if a.status == "SUBMITTED" and a.completed_at]

    avg_score = 0.0
    avg_time = 0.0
    if completed_attempts:
        avg_score = round(sum(a.total_score for a in completed_attempts) / len(completed_attempts), 1)
        times = [(a.completed_at - a.started_at).total_seconds() / 60.0 for a in completed_attempts]
        avg_time = round(sum(times) / len(times), 1)

    all_hints = db.query(HintUsage).all()
    avg_hints = round(len(all_hints) / total_cand, 1) if total_cand > 0 else 0.0

    return AdminDashboardOut(
        total_candidates=total_cand,
        active_candidates=active_cand,
        completed_candidates=completed_cand,
        average_score=avg_score,
        average_completion_time_minutes=avg_time,
        average_hints_used=avg_hints
    )

@router.get("/candidates", response_model=List[CandidateSummaryOut])
def list_candidates(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    candidates = db.query(User).filter(User.role == "candidate").all()

    result = []
    for c in candidates:
        att = db.query(Attempt).filter(Attempt.candidate_id == c.id).order_by(Attempt.started_at.desc()).first()

        status_str = att.status if att else "NOT_STARTED"
        total_score = att.total_score if att else 0.0
        stages_comp = att.current_stage_order if att else 0
        hints_cnt = db.query(HintUsage).filter(HintUsage.attempt_id == att.id).count() if att else 0

        dur_mins = None
        if att and att.completed_at:
            dur_mins = round((att.completed_at - att.started_at).total_seconds() / 60.0, 1)

        result.append(CandidateSummaryOut(
            candidate_id=c.id,
            full_name=c.full_name,
            email=c.email,
            status=status_str,
            total_score=total_score,
            stages_completed=stages_comp,
            total_stages=8,
            duration_minutes=dur_mins,
            hints_used=hints_cnt,
            submitted_at=att.completed_at if att else None
        ))

    return result

@router.get("/candidates/{candidate_id}", response_model=CandidateDetailOut)
def get_candidate_detail(candidate_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    cand = db.query(User).filter(User.id == candidate_id, User.role == "candidate").first()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    att = db.query(Attempt).filter(Attempt.candidate_id == cand.id).order_by(Attempt.started_at.desc()).first()
    if not att:
        raise HTTPException(status_code=404, detail="No assessment attempt for candidate.")

    # Calculate stage breakdown scores
    subs = db.query(Submission).filter(Submission.attempt_id == att.id, Submission.is_correct == True).all()
    stage_scores = {}
    for s in subs:
        st_name = f"Stage {s.challenge.stage.stage_order}"
        stage_scores[st_name] = s.points_awarded

    code_sub = db.query(CodeSubmission).filter(CodeSubmission.attempt_id == att.id).order_by(CodeSubmission.submitted_at.desc()).first()
    if code_sub:
        stage_scores["Stage 7"] = code_sub.score_awarded

    if att.report and att.report.score:
        stage_scores["Stage 8"] = att.report.score

    # Estimate time per stage from event logs
    events = db.query(EventLog).filter(EventLog.attempt_id == att.id).order_by(EventLog.created_at).all()
    time_per_stage = {}
    prev_time = att.started_at
    for e in events:
        if e.event_type == "FLAG_SUBMITTED" and e.metadata_json and e.metadata_json.get("is_correct"):
            st_ord = e.metadata_json.get("stage_order")
            st_key = f"Stage {st_ord}"
            diff = (e.created_at - prev_time).total_seconds() / 60.0
            time_per_stage[st_key] = round(diff, 1)
            prev_time = e.created_at

    hints_cnt = db.query(HintUsage).filter(HintUsage.attempt_id == att.id).count()
    failed_cnt = db.query(Submission).filter(Submission.attempt_id == att.id, Submission.is_correct == False).count()

    rep_out = None
    rep_score = 0.0
    rep_notes = None
    if att.report:
        rep_out = IncidentReportSchema(
            executive_summary=att.report.executive_summary,
            attack_vector=att.report.attack_vector,
            vulnerabilities=att.report.vulnerabilities,
            compromised_components=att.report.compromised_components,
            timeline=att.report.timeline,
            iocs=att.report.iocs,
            impact=att.report.impact,
            root_cause=att.report.root_cause,
            mitigations=att.report.mitigations,
            secure_coding_changes=att.report.secure_coding_changes,
            additional_observations=att.report.additional_observations
        )
        rep_score = att.report.score
        rep_notes = att.report.admin_notes

    code_subs_out = []
    all_code_subs = db.query(CodeSubmission).filter(CodeSubmission.attempt_id == att.id).all()
    for cs in all_code_subs:
        code_subs_out.append({
            "id": cs.id,
            "code": cs.code,
            "tests_passed": cs.tests_passed,
            "tests_total": cs.tests_total,
            "score_awarded": cs.score_awarded,
            "output": cs.execution_logs,
            "submitted_at": cs.submitted_at.isoformat()
        })

    return CandidateDetailOut(
        candidate_id=cand.id,
        full_name=cand.full_name,
        email=cand.email,
        attempt_id=att.id,
        status=att.status,
        started_at=att.started_at,
        completed_at=att.completed_at,
        total_score=att.total_score,
        current_stage=att.current_stage_order,
        stage_scores=stage_scores,
        time_per_stage_minutes=time_per_stage,
        hints_used_count=hints_cnt,
        failed_attempts_count=failed_cnt,
        report=rep_out,
        report_score=rep_score,
        report_notes=rep_notes,
        code_submissions=code_subs_out
    )

@router.post("/reports/{attempt_id}/score")
def score_candidate_report(
    attempt_id: int,
    body: ReportReviewRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    if body.score < 0.0 or body.score > 10.0:
        raise HTTPException(status_code=400, detail="Score must be between 0 and 10 points.")

    att = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found.")

    if not att.report:
        att.report = IncidentReport(attempt_id=att.id, candidate_id=att.candidate_id)

    old_rep_score = att.report.score or 0.0
    att.report.score = body.score
    att.report.admin_notes = body.admin_notes
    att.report.reviewed_at = datetime.datetime.utcnow()
    att.report.reviewed_by_id = admin.id

    # Recalculate total score
    flag_subs = db.query(Submission).filter(Submission.attempt_id == att.id, Submission.is_correct == True).all()
    flag_pts = sum(s.points_awarded for s in flag_subs)
    code_sub = db.query(CodeSubmission).filter(CodeSubmission.attempt_id == att.id).order_by(CodeSubmission.submitted_at.desc()).first()
    code_pts = code_sub.score_awarded if code_sub else 0.0

    att.total_score = flag_pts + code_pts + body.score

    db.commit()
    return {"status": "SUCCESS", "new_total_score": att.total_score, "report_score": body.score}

@router.get("/leaderboard", response_model=List[LeaderboardEntryOut])
def get_leaderboard(db: Session = Depends(get_db)):
    attempts = db.query(Attempt).filter(Attempt.status.in_(["SUBMITTED", "IN_PROGRESS"])).all()

    items = []
    for a in attempts:
        dur = None
        if a.completed_at:
            dur = round((a.completed_at - a.started_at).total_seconds() / 60.0, 1)
        elif a.started_at:
            dur = round((datetime.datetime.utcnow() - a.started_at).total_seconds() / 60.0, 1)

        hints_cnt = db.query(HintUsage).filter(HintUsage.attempt_id == a.id).count()

        items.append({
            "attempt": a,
            "candidate_id": a.candidate_id,
            "candidate_name": a.candidate.full_name,
            "total_score": a.total_score,
            "completion_time_minutes": dur,
            "stages_completed": a.current_stage_order,
            "hints_used": hints_cnt,
            "status": a.status
        })

    # Sort rules:
    # 1. Total score DESC
    # 2. Completion time ASC (None treated as infinity)
    # 3. Hints used ASC
    items.sort(key=lambda x: (-x["total_score"], x["completion_time_minutes"] or 999999, x["hints_used"]))

    result = []
    for rank, item in enumerate(items, 1):
        result.append(LeaderboardEntryOut(
            rank=rank,
            candidate_id=item["candidate_id"],
            candidate_name=item["candidate_name"],
            total_score=item["total_score"],
            completion_time_minutes=item["completion_time_minutes"],
            stages_completed=item["stages_completed"],
            hints_used=item["hints_used"],
            status=item["status"]
        ))

    return result

@router.get("/export")
def export_candidates(format: str = "csv", admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    candidates = db.query(User).filter(User.role == "candidate").all()

    data = []
    for c in candidates:
        att = db.query(Attempt).filter(Attempt.candidate_id == c.id).order_by(Attempt.started_at.desc()).first()
        hints_cnt = db.query(HintUsage).filter(HintUsage.attempt_id == att.id).count() if att else 0
        attempts_cnt = db.query(Submission).filter(Submission.attempt_id == att.id).count() if att else 0

        dur = None
        if att and att.completed_at:
            dur = round((att.completed_at - att.started_at).total_seconds() / 60.0, 1)

        rep_score = att.report.score if att and att.report else 0.0

        data.append({
            "Candidate": c.full_name,
            "Email": c.email,
            "Status": att.status if att else "NOT_STARTED",
            "Score": att.total_score if att else 0.0,
            "DurationMinutes": dur,
            "StagesCompleted": att.current_stage_order if att else 0,
            "HintsUsed": hints_cnt,
            "FlagAttempts": attempts_cnt,
            "ReportScore": rep_score
        })

    if format.lower() == "json":
        return data

    # CSV output
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["Candidate", "Email", "Status", "Score", "DurationMinutes", "StagesCompleted", "HintsUsed", "FlagAttempts", "ReportScore"])
    writer.writeheader()
    for row in data:
        writer.writerow(row)

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=astranex_cyber_range_results.csv"}
    )
