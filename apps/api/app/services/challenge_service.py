import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models import Attempt, Stage, Challenge, Submission, HintUsage, EventLog, IncidentReport, CodeSubmission
from app.security import hash_flag

HINT_PENALTY_MAP = {
    1: 0.90,
    2: 0.75,
    3: 0.50
}

def get_candidate_attempt(db: Session, candidate_id: int) -> Attempt:
    attempt = db.query(Attempt).filter(
        Attempt.candidate_id == candidate_id,
        Attempt.status == "IN_PROGRESS"
    ).first()
    
    if not attempt:
        # Check if completed attempt exists
        attempt = db.query(Attempt).filter(
            Attempt.candidate_id == candidate_id
        ).order_by(Attempt.started_at.desc()).first()
        
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active assessment attempt found. Please start mission briefing."
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

    input_hash = hash_flag(flag_input)
    is_correct = (input_hash == challenge.flag_hash)

    # Count previous submissions
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
        
        # Update attempt score and stage progression if not already completed
        if stage.stage_order == attempt.current_stage_order:
            attempt.current_stage_order = stage.stage_order + 1
            next_stage_order = attempt.current_stage_order
            
            # Recalculate total score
            existing_submissions = db.query(Submission).filter(
                Submission.attempt_id == attempt.id,
                Submission.is_correct == True
            ).all()
            
            total = sum(s.points_awarded for s in existing_submissions) + points_awarded
            # Add code submission score if any
            code_sub = db.query(CodeSubmission).filter(CodeSubmission.attempt_id == attempt.id).first()
            if code_sub:
                total += code_sub.score_awarded
            # Add report score if reviewed
            if attempt.report and attempt.report.score:
                total += attempt.report.score
                
            attempt.total_score = total

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
