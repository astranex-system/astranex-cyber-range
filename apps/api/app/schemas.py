from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Stage & Challenge Schemas
class ChallengeOut(BaseModel):
    id: int
    stage_id: int
    title: str
    description: Optional[str] = None
    challenge_type: str
    max_points: int
    hint_1_available: bool = False
    hint_2_available: bool = False
    hint_3_available: bool = False
    hint_1_unlocked: bool = False
    hint_2_unlocked: bool = False
    hint_3_unlocked: bool = False
    hint_1_text: Optional[str] = None
    hint_2_text: Optional[str] = None
    hint_3_text: Optional[str] = None
    payload_data: Optional[Dict[str, Any]] = None

class StageOut(BaseModel):
    id: int
    stage_order: int
    name: str
    title: str
    description: Optional[str] = None
    points: int
    is_locked: bool = True
    is_completed: bool = False
    challenges: List[ChallengeOut] = []

class AssessmentOut(BaseModel):
    id: int
    name: str
    tagline: Optional[str] = None
    description: Optional[str] = None
    type: str
    duration_minutes: int
    total_points: int

# Attempt Schemas
class AttemptOut(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str
    assessment_id: int
    started_at: datetime
    expires_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    current_stage_order: int
    total_score: float
    remaining_seconds: int

# Challenge Operations
class FlagSubmissionRequest(BaseModel):
    challenge_id: int
    flag: str

class SubmissionResultOut(BaseModel):
    is_correct: bool
    message: str
    stage_unlocked: Optional[int] = None
    points_awarded: float = 0.0
    total_score: float = 0.0

class HintRequest(BaseModel):
    challenge_id: int
    hint_level: int  # 1, 2, or 3

class HintResponse(BaseModel):
    hint_level: int
    hint_text: str
    penalty_factor: float

class CodeSubmissionRequest(BaseModel):
    challenge_id: int
    code: str

class CodeResultOut(BaseModel):
    tests_passed: int
    tests_total: int
    passed_all: bool
    score_awarded: float
    output: str

# Incident Report Schemas
class IncidentReportSchema(BaseModel):
    executive_summary: Optional[str] = None
    attack_vector: Optional[str] = None
    vulnerabilities: Optional[str] = None
    compromised_components: Optional[str] = None
    timeline: Optional[str] = None
    iocs: Optional[str] = None
    impact: Optional[str] = None
    root_cause: Optional[str] = None
    mitigations: Optional[str] = None
    secure_coding_changes: Optional[str] = None
    additional_observations: Optional[str] = None

class ReportReviewRequest(BaseModel):
    score: float  # 0 to 10
    admin_notes: Optional[str] = None

# Admin Schemas
class AdminDashboardOut(BaseModel):
    total_candidates: int
    active_candidates: int
    completed_candidates: int
    average_score: float
    average_completion_time_minutes: float
    average_hints_used: float

class CandidateSummaryOut(BaseModel):
    candidate_id: int
    full_name: str
    email: str
    status: str
    total_score: float
    stages_completed: int
    total_stages: int = 8
    duration_minutes: Optional[float] = None
    hints_used: int
    submitted_at: Optional[datetime] = None

class CandidateDetailOut(BaseModel):
    candidate_id: int
    full_name: str
    email: str
    attempt_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    total_score: float
    current_stage: int
    stage_scores: Dict[str, float]
    time_per_stage_minutes: Dict[str, float]
    hints_used_count: int
    failed_attempts_count: int
    report: Optional[IncidentReportSchema] = None
    report_score: float = 0.0
    report_notes: Optional[str] = None
    code_submissions: List[Dict[str, Any]] = []

class LeaderboardEntryOut(BaseModel):
    rank: int
    candidate_id: int
    candidate_name: str
    total_score: float
    completion_time_minutes: Optional[float] = None
    stages_completed: int
    hints_used: int
    status: str
