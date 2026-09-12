import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import Attempt, Stage, Challenge, Submission, HintUsage, EventLog, IncidentReport, CodeSubmission, Assessment
from app.security import hash_flag

HINT_PENALTY_MAP = {
    1: 0.90,
    2: 0.75,
    3: 0.50
}

def get_candidate_attempt(db: Session, candidate_id: int, auto_create: bool = True) -> Attempt:
    attempt = db.query(Attempt).filter(
        Attempt.candidate_id == candidate_id,
        Attempt.status == "IN_PROGRESS"
    ).first()
    
    if not attempt:
        # Check if completed attempt exists
        attempt = db.query(Attempt).filter(
            Attempt.candidate_id == candidate_id
        ).order_by(Attempt.started_at.desc()).first()
        
    if not attempt and auto_create:
        assessment = db.query(Assessment).filter(Assessment.status == "ACTIVE").first()
        if assessment:
            now = datetime.datetime.utcnow()
            expires = now + datetime.timedelta(minutes=assessment.duration_minutes)
            attempt = Attempt(
                candidate_id=candidate_id,
                assessment_id=assessment.id,
                started_at=now,
                expires_at=expires,
                status="IN_PROGRESS",
                current_stage_order=0,
                total_score=0.0
            )
            db.add(attempt)
            db.commit()
            db.refresh(attempt)
            
            # Log event
            db.add(EventLog(
                attempt_id=attempt.id,
                candidate_id=candidate_id,
                event_type="ATTEMPT_AUTO_INITIALIZED",
                metadata_json={"started_at": now.isoformat()}
            ))
            db.commit()

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No assessment attempt found. Please contact AstraNex administrator."
        )
        
    # Check server-authoritative timer expiration
    now = datetime.datetime.utcnow()
    if attempt.status == "IN_PROGRESS" and now > attempt.expires_at:
        attempt.status = "EXPIRED"
        db.commit()
        # Log event
        db.add(EventLog(
            attempt_id=attempt.id,
            candidate_id=candidate_id,
            event_type="TIMER_EXPIRED",
            metadata_json={"expired_at": now.isoformat()}
        ))
        db.commit()
        
    return attempt

def calculate_effective_points(max_points: int, hints_used: list[HintUsage]) -> float:
    if not hints_used:
        return float(max_points)
    # Use lowest penalty factor requested
    min_factor = min(h.penalty_factor for h in hints_used)
    return round(max_points * min_factor, 1)

def recalculate_attempt_score(db: Session, attempt: Attempt):
    """
    Recalculates the total score for an attempt based on:
    1. Correct flag submissions (taking max points per challenge_id to prevent duplicates)
    2. Highest score awarded from code submissions (Stage 7)
    3. Admin/Evaluator report score (Stage 8)
    """
    correct_subs = db.query(Submission).filter(
        Submission.attempt_id == attempt.id,
        Submission.is_correct == True
    ).all()
    
    challenge_points = {}
    for s in correct_subs:
        if s.challenge_id not in challenge_points or s.points_awarded > challenge_points[s.challenge_id]:
            challenge_points[s.challenge_id] = s.points_awarded
            
    flag_pts = sum(challenge_points.values())
    
    # Code submission score (Stage 7)
    code_sub = db.query(CodeSubmission).filter(
        CodeSubmission.attempt_id == attempt.id
    ).order_by(CodeSubmission.score_awarded.desc()).first()
    code_pts = code_sub.score_awarded if code_sub else 0.0
    
    # Report score (Stage 8)
    report_pts = attempt.report.score if (attempt.report and attempt.report.score) else 0.0
    
    attempt.total_score = round(flag_pts + code_pts + report_pts, 1)

def validate_flag_submission(
    db: Session,
    attempt: Attempt,
    challenge: Challenge,
    flag_input: str
) -> Tuple[bool, float, int]:
    """
    Validates flag submission against server-stored flag hash.
    Unlocks next stage upon correct submission.
    """
    if attempt.status != "IN_PROGRESS":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment attempt is closed or expired."
        )
        
    # Check if stage is locked for current candidate attempt
    stage = challenge.stage
    if stage.stage_order > attempt.current_stage_order:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Stage {stage.stage_order} is locked. Complete preceding stages first."
        )

    # Check if this challenge was already solved by candidate
    existing_correct_sub = db.query(Submission).filter(
        Submission.attempt_id == attempt.id,
        Submission.challenge_id == challenge.id,
        Submission.is_correct == True
    ).first()

    if existing_correct_sub:
        return True, existing_correct_sub.points_awarded, attempt.current_stage_order

    input_hash = hash_flag(flag_input)
    is_correct = (input_hash == challenge.flag_hash)

    # Count previous attempts for this challenge
    prev_count = db.query(Submission).filter(
        Submission.attempt_id == attempt.id,
        Submission.challenge_id == challenge.id
    ).count()

    hints_used = db.query(HintUsage).filter(
        HintUsage.attempt_id == attempt.id,
        HintUsage.challenge_id == challenge.id
    ).all()

    points_awarded = 0.0
    next_stage_order = attempt.current_stage_order

    if is_correct:
        points_awarded = calculate_effective_points(challenge.max_points, hints_used)
        
        # Update stage progression if currently on this stage
        if stage.stage_order == attempt.current_stage_order:
            attempt.current_stage_order = stage.stage_order + 1
            next_stage_order = attempt.current_stage_order

    # Record submission entry
    sub = Submission(
        attempt_id=attempt.id,
        challenge_id=challenge.id,
        stage_id=stage.id,
        submission_text=flag_input,
        is_correct=is_correct,
        points_awarded=points_awarded if is_correct else 0.0,
        attempts_count=prev_count + 1
    )
    db.add(sub)
    db.flush()

    if is_correct:
        recalculate_attempt_score(db, attempt)

    # Audit event
    db.add(EventLog(
        attempt_id=attempt.id,
        candidate_id=attempt.candidate_id,
        event_type="FLAG_SUBMITTED",
        metadata_json={
            "challenge_id": challenge.id,
            "stage_order": stage.stage_order,
            "is_correct": is_correct,
            "points_awarded": points_awarded
        }
    ))
    
    db.commit()
    db.refresh(attempt)
    return is_correct, points_awarded, next_stage_order

def request_challenge_hint(
    db: Session,
    attempt: Attempt,
    challenge: Challenge,
    hint_level: int
) -> Tuple[str, float]:
    if hint_level not in [1, 2, 3]:
        raise HTTPException(status_code=400, detail="Invalid hint level. Must be 1, 2, or 3.")

    hint_text = getattr(challenge, f"hint_{hint_level}")
    if not hint_text:
        raise HTTPException(status_code=404, detail=f"Hint {hint_level} is not available for this challenge.")

    penalty_factor = HINT_PENALTY_MAP[hint_level]

    # Check if hint already requested
    existing = db.query(HintUsage).filter(
        HintUsage.attempt_id == attempt.id,
        HintUsage.challenge_id == challenge.id,
        HintUsage.hint_level == hint_level
    ).first()

    if not existing:
        db.add(HintUsage(
            attempt_id=attempt.id,
            challenge_id=challenge.id,
            hint_level=hint_level,
            penalty_factor=penalty_factor
        ))
        
        # Log event
        db.add(EventLog(
            attempt_id=attempt.id,
            candidate_id=attempt.candidate_id,
            event_type="HINT_REQUESTED",
            metadata_json={
                "challenge_id": challenge.id,
                "hint_level": hint_level,
                "penalty_factor": penalty_factor
            }
        ))
        db.commit()

    return hint_text, penalty_factor
