import datetime
import json
import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    User, Assessment, Stage, Challenge, Attempt, Submission, HintUsage, EventLog, IncidentReport, CodeSubmission
)
from app.schemas import (
    AssessmentOut, AttemptOut, StageOut, ChallengeOut,
    FlagSubmissionRequest, SubmissionResultOut, HintRequest, HintResponse,
    CodeSubmissionRequest, CodeResultOut, IncidentReportSchema
)
from app.security import get_current_user, check_rate_limit
from app.services.challenge_service import (
    get_candidate_attempt, validate_flag_submission, request_challenge_hint, recalculate_attempt_score
)
from app.services.sandbox import run_code_in_sandbox

router = APIRouter(prefix="/api", tags=["Assessment Candidate Engine"])

def get_challenges_dir():
    env_dir = os.getenv("CHALLENGES_DIR")
    if env_dir and os.path.exists(env_dir):
        return env_dir

    cur_file = os.path.abspath(__file__)
    candidates = [
        os.path.abspath(os.path.join(os.path.dirname(cur_file), "../../challenges/operation-blackout")),
        os.path.abspath(os.path.join(os.path.dirname(cur_file), "../../../challenges/operation-blackout")),
        os.path.abspath(os.path.join(os.path.dirname(cur_file), "../../../../challenges/operation-blackout")),
        os.path.abspath(os.path.join(os.getcwd(), "challenges/operation-blackout")),
        os.path.abspath(os.path.join(os.getcwd(), "apps/api/challenges/operation-blackout")),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return candidates[0]

CHALLENGES_DIR = get_challenges_dir()

@router.get("/assessment", response_model=AssessmentOut)
def get_assessment(db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.status == "ACTIVE").first()
    if not assessment:
        raise HTTPException(status_code=404, detail="No active assessment found.")
    return assessment

@router.post("/assessment/start", response_model=AttemptOut)
def start_assessment(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assessment = db.query(Assessment).filter(Assessment.status == "ACTIVE").first()
    if not assessment:
        raise HTTPException(status_code=404, detail="No active assessment found.")

    # Check for existing active attempt
    existing = db.query(Attempt).filter(
        Attempt.candidate_id == current_user.id,
        Attempt.assessment_id == assessment.id,
        Attempt.status == "IN_PROGRESS"
    ).first()

    now = datetime.datetime.utcnow()
    if existing:
        if now > existing.expires_at:
            existing.status = "EXPIRED"
            db.commit()
        else:
            rem_sec = int((existing.expires_at - now).total_seconds())
            return AttemptOut(
                id=existing.id,
                candidate_id=current_user.id,
                candidate_name=current_user.full_name,
                assessment_id=assessment.id,
                started_at=existing.started_at,
                expires_at=existing.expires_at,
                completed_at=existing.completed_at,
                status=existing.status,
                current_stage_order=existing.current_stage_order,
                total_score=existing.total_score,
                remaining_seconds=max(0, rem_sec)
            )

    # Create new Attempt with 90-min timer
    expires = now + datetime.timedelta(minutes=assessment.duration_minutes)
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")

    attempt = Attempt(
        candidate_id=current_user.id,
        assessment_id=assessment.id,
        started_at=now,
        expires_at=expires,
        status="IN_PROGRESS",
        current_stage_order=0,
        total_score=0.0,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(attempt)
    db.flush()

    # Log MISSION_STARTED event
    db.add(EventLog(
        attempt_id=attempt.id,
        candidate_id=current_user.id,
        event_type="MISSION_STARTED",
        metadata_json={
            "assessment_id": assessment.id,
            "started_at": now.isoformat(),
            "expires_at": expires.isoformat()
        }
    ))
    db.commit()
    db.refresh(attempt)

    rem_sec = int((attempt.expires_at - now).total_seconds())
    return AttemptOut(
        id=attempt.id,
        candidate_id=current_user.id,
        candidate_name=current_user.full_name,
        assessment_id=assessment.id,
        started_at=attempt.started_at,
        expires_at=attempt.expires_at,
        completed_at=attempt.completed_at,
        status=attempt.status,
        current_stage_order=attempt.current_stage_order,
        total_score=attempt.total_score,
        remaining_seconds=max(0, rem_sec)
    )

@router.post("/assessment/acknowledge_briefing")
def acknowledge_briefing(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order == 0:
        attempt.current_stage_order = 1
        db.add(EventLog(
            attempt_id=attempt.id,
            candidate_id=current_user.id,
            event_type="BRIEFING_ACKNOWLEDGED",
            metadata_json={"acknowledged_at": datetime.datetime.utcnow().isoformat()}
        ))
        db.commit()
    return {"status": "SUCCESS", "current_stage_order": attempt.current_stage_order}


@router.get("/assessment/attempt", response_model=AttemptOut)
def get_attempt_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    now = datetime.datetime.utcnow()
    rem_sec = int((attempt.expires_at - now).total_seconds()) if attempt.status == "IN_PROGRESS" else 0

    return AttemptOut(
        id=attempt.id,
        candidate_id=current_user.id,
        candidate_name=current_user.full_name,
        assessment_id=attempt.assessment_id,
        started_at=attempt.started_at,
        expires_at=attempt.expires_at,
        completed_at=attempt.completed_at,
        status=attempt.status,
        current_stage_order=attempt.current_stage_order,
        total_score=attempt.total_score,
        remaining_seconds=max(0, rem_sec)
    )

@router.get("/stages", response_model=List[StageOut])
def list_stages(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    stages = db.query(Stage).filter(Stage.assessment_id == attempt.assessment_id).order_by(Stage.stage_order).all()

    result = []
    for st in stages:
        is_locked = st.stage_order > attempt.current_stage_order
        is_completed = st.stage_order < attempt.current_stage_order

        ch_outs = []
        for ch in st.challenges:
            hints_used = db.query(HintUsage).filter(
                HintUsage.attempt_id == attempt.id,
                HintUsage.challenge_id == ch.id
            ).all()
            used_levels = {h.hint_level for h in hints_used}

            h1_text = ch.hint_1 if 1 in used_levels else None
            h2_text = ch.hint_2 if 2 in used_levels else None
            h3_text = ch.hint_3 if 3 in used_levels else None

            ch_outs.append(ChallengeOut(
                id=ch.id,
                stage_id=st.id,
                title=ch.title,
                description=ch.description if not is_locked else "Stage Locked",
                challenge_type=ch.challenge_type,
                max_points=ch.max_points,
                hint_1_available=bool(ch.hint_1),
                hint_2_available=bool(ch.hint_2),
                hint_3_available=bool(ch.hint_3),
                hint_1_unlocked=1 in used_levels,
                hint_2_unlocked=2 in used_levels,
                hint_3_unlocked=3 in used_levels,
                hint_1_text=h1_text,
                hint_2_text=h2_text,
                hint_3_text=h3_text,
                payload_data=ch.payload_data if not is_locked else None
            ))

        result.append(StageOut(
            id=st.id,
            stage_order=st.stage_order,
            name=st.name,
            title=st.title,
            description=st.description,
            points=st.points,
            is_locked=is_locked,
            is_completed=is_completed,
            challenges=ch_outs
        ))

    return result

@router.post("/challenges/{challenge_id}/submit", response_model=SubmissionResultOut)
def submit_flag(
    challenge_id: int,
    body: FlagSubmissionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = get_candidate_attempt(db, current_user.id)

    # Rate limiting: max 10 attempts per minute per candidate per challenge
    rate_key = f"flag_sub_{current_user.id}_{challenge_id}"
    check_rate_limit(rate_key, max_requests=10, window_seconds=60)

    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    is_correct, points_awarded, next_stage = validate_flag_submission(
        db, attempt, challenge, body.flag
    )

    msg = "FLAG VERIFIED CORRECT! Stage Unlocked." if is_correct else "Incorrect Flag. Check evidence and retry."
    return SubmissionResultOut(
        is_correct=is_correct,
        message=msg,
        stage_unlocked=next_stage if is_correct else None,
        points_awarded=points_awarded,
        total_score=attempt.total_score
    )

@router.post("/challenges/{challenge_id}/hint", response_model=HintResponse)
def get_hint(
    challenge_id: int,
    body: HintRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = get_candidate_attempt(db, current_user.id)
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")

    hint_text, penalty_factor = request_challenge_hint(
        db, attempt, challenge, body.hint_level
    )

    return HintResponse(
        hint_level=body.hint_level,
        hint_text=hint_text,
        penalty_factor=penalty_factor
    )

# Stage Specific Forensics & File Downloads
@router.get("/challenges/stage4/logs")
def get_stage4_logs(log_name: str = "auth.log", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order < 4:
        raise HTTPException(status_code=403, detail="Stage 4 is locked.")

    valid_logs = ["auth.log", "gateway.log", "telemetry.log", "command.log", "system.log"]
    if log_name not in valid_logs:
        raise HTTPException(status_code=400, detail="Invalid log file requested.")

    path = os.path.join(CHALLENGES_DIR, "stage-4", log_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Log file missing.")

    with open(path, "r") as f:
        content = f.read()

    return {"filename": log_name, "content": content}

@router.get("/challenges/stage4/download/{log_name}")
def download_stage4_log(log_name: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order < 4:
        raise HTTPException(status_code=403, detail="Stage 4 is locked.")

    valid_logs = ["auth.log", "gateway.log", "telemetry.log", "command.log", "system.log"]
    if log_name not in valid_logs:
        raise HTTPException(status_code=400, detail="Invalid log file requested.")

    path = os.path.join(CHALLENGES_DIR, "stage-4", log_name)
    return FileResponse(path, filename=log_name, media_type="text/plain")

@router.get("/challenges/stage5/pcap")
def get_stage5_pcap_json(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order < 5:
        raise HTTPException(status_code=403, detail="Stage 5 is locked.")

    path = os.path.join(CHALLENGES_DIR, "stage-5", "pcap_summary.json")
    with open(path, "r") as f:
        data = json.load(f)
    return data

@router.get("/challenges/stage5/download")
def download_stage5_pcap(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order < 5:
        raise HTTPException(status_code=403, detail="Stage 5 is locked.")

    path = os.path.join(CHALLENGES_DIR, "stage-5", "ax07_capture.pcap")
    return FileResponse(path, filename="ax07_capture.pcap", media_type="application/vnd.tcpdump.pcap")

@router.get("/challenges/stage6/file")
def get_stage6_malware_file(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order < 6:
        raise HTTPException(status_code=403, detail="Stage 6 is locked.")

    path = os.path.join(CHALLENGES_DIR, "stage-6", "telemetry_update.sh")
    with open(path, "r") as f:
        content = f.read()
    return {"filename": "telemetry_update.sh", "content": content}

@router.get("/challenges/stage7/code")
def get_stage7_code_template(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order < 7:
        raise HTTPException(status_code=403, detail="Stage 7 is locked.")

    path = os.path.join(CHALLENGES_DIR, "stage-7", "vulnerable_auth.py")
    with open(path, "r") as f:
        content = f.read()
    return {"filename": "auth.py", "content": content}

@router.post("/code/{challenge_id}/submit", response_model=CodeResultOut)
def submit_code_challenge(
    challenge_id: int,
    body: CodeSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = get_candidate_attempt(db, current_user.id)
    if attempt.current_stage_order < 7:
        raise HTTPException(status_code=403, detail="Stage 7 is locked.")

    result = run_code_in_sandbox(body.code)

    # Save code submission entry
    cs = CodeSubmission(
        attempt_id=attempt.id,
        challenge_id=challenge_id,
        code=body.code,
        tests_passed=result["tests_passed"],
        tests_total=result["tests_total"],
        score_awarded=result["score_awarded"],
        execution_logs=result["output"]
    )
    db.add(cs)
    db.flush()

    # If candidate passes all 10 tests, unlock Stage 8
    if result["passed_all"]:
        if attempt.current_stage_order == 7:
            attempt.current_stage_order = 8
            
    # Always recalculate total score so candidate gets earned code points
    recalculate_attempt_score(db, attempt)

    # Audit event
    db.add(EventLog(
        attempt_id=attempt.id,
        candidate_id=current_user.id,
        event_type="CODE_SUBMITTED",
        metadata_json={
            "challenge_id": challenge_id,
            "tests_passed": result["tests_passed"],
            "score_awarded": result["score_awarded"]
        }
    ))
    db.commit()
    db.refresh(attempt)

    return CodeResultOut(
        tests_passed=result["tests_passed"],
        tests_total=result["tests_total"],
        passed_all=result["passed_all"],
        score_awarded=result["score_awarded"],
        output=result["output"]
    )

@router.post("/report")
def submit_incident_report(
    report_data: IncidentReportSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    attempt = get_candidate_attempt(db, current_user.id)

    report = db.query(IncidentReport).filter(IncidentReport.attempt_id == attempt.id).first()
    if not report:
        report = IncidentReport(
            attempt_id=attempt.id,
            candidate_id=current_user.id
        )
        db.add(report)

    for field, val in report_data.dict(exclude_unset=True).items():
        setattr(report, field, val)

    report.submitted_at = datetime.datetime.utcnow()

    # Complete candidate attempt
    attempt.status = "SUBMITTED"
    attempt.completed_at = datetime.datetime.utcnow()
    attempt.current_stage_order = 8

    recalculate_attempt_score(db, attempt)

    # Audit event
    db.add(EventLog(
        attempt_id=attempt.id,
        candidate_id=current_user.id,
        event_type="REPORT_SUBMITTED",
        metadata_json={"submitted_at": report.submitted_at.isoformat()}
    ))

    db.commit()
    db.refresh(attempt)
    return {"status": "SUCCESS", "message": "Incident Report submitted successfully for AstraNex evaluation."}
