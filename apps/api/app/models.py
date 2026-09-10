import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="candidate", index=True)  # "admin" or "candidate"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempts = relationship("Attempt", back_populates="candidate", cascade="all, delete-orphan")
    reports = relationship("IncidentReport", foreign_keys="IncidentReport.candidate_id", back_populates="candidate")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    tagline = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    type = Column(String, default="CYBERSECURITY", index=True)  # CYBERSECURITY, SOFTWARE_ENGINEERING, ROBOTICS, AI_ML
    duration_minutes = Column(Integer, default=90)
    total_points = Column(Integer, default=100)
    status = Column(String, default="ACTIVE", index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    stages = relationship("Stage", back_populates="assessment", order_by="Stage.stage_order", cascade="all, delete-orphan")
    attempts = relationship("Attempt", back_populates="assessment", cascade="all, delete-orphan")

class Stage(Base):
    __tablename__ = "stages"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    stage_order = Column(Integer, nullable=False, index=True)  # 0, 1, 2, 3, 4, 5, 6, 7, 8
    name = Column(String, nullable=False)  # e.g. "RECONNAISSANCE"
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    points = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assessment = relationship("Assessment", back_populates="stages")
    challenges = relationship("Challenge", back_populates="stage", cascade="all, delete-orphan")

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    challenge_type = Column(String, default="FLAG")  # FLAG, CODE, REPORT
    flag_hash = Column(String, nullable=True)  # SHA-256 hash of flag
    max_points = Column(Integer, default=10)
    
    hint_1 = Column(Text, nullable=True)
    hint_2 = Column(Text, nullable=True)
    hint_3 = Column(Text, nullable=True)
    
    payload_data = Column(JSON, nullable=True)  # Extra context data for frontend challenge simulation
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    stage = relationship("Stage", back_populates="challenges")
    submissions = relationship("Submission", back_populates="challenge")
    hints = relationship("HintUsage", back_populates="challenge")

class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False, index=True)
    
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    status = Column(String, default="IN_PROGRESS", index=True)  # IN_PROGRESS, SUBMITTED, EXPIRED
    current_stage_order = Column(Integer, default=0, nullable=False)
    total_score = Column(Float, default=0.0)
    
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    candidate = relationship("User", back_populates="attempts")
    assessment = relationship("Assessment", back_populates="attempts")
    submissions = relationship("Submission", back_populates="attempt", cascade="all, delete-orphan")
    hints = relationship("HintUsage", back_populates="attempt", cascade="all, delete-orphan")
    events = relationship("EventLog", back_populates="attempt", cascade="all, delete-orphan")
    code_submissions = relationship("CodeSubmission", back_populates="attempt", cascade="all, delete-orphan")
    report = relationship("IncidentReport", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)
    stage_id = Column(Integer, ForeignKey("stages.id"), nullable=False, index=True)
    
    submission_text = Column(String, nullable=False)
    is_correct = Column(Boolean, default=False)
    points_awarded = Column(Float, default=0.0)
    attempts_count = Column(Integer, default=1)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    attempt = relationship("Attempt", back_populates="submissions")
    challenge = relationship("Challenge", back_populates="submissions")

class HintUsage(Base):
    __tablename__ = "hints"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)
    
    hint_level = Column(Integer, nullable=False)  # 1, 2, or 3
    penalty_factor = Column(Float, nullable=False)  # 0.90, 0.75, or 0.50
    requested_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("Attempt", back_populates="hints")
    challenge = relationship("Challenge", back_populates="hints")

class CodeSubmission(Base):
    __tablename__ = "code_submissions"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False, index=True)
    
    code = Column(Text, nullable=False)
    tests_passed = Column(Integer, default=0)
    tests_total = Column(Integer, default=0)
    score_awarded = Column(Float, default=0.0)
    execution_logs = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("Attempt", back_populates="code_submissions")

class IncidentReport(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), unique=True, nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    executive_summary = Column(Text, nullable=True)
    attack_vector = Column(Text, nullable=True)
    vulnerabilities = Column(Text, nullable=True)
    compromised_components = Column(Text, nullable=True)
    timeline = Column(Text, nullable=True)
    iocs = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)
    root_cause = Column(Text, nullable=True)
    mitigations = Column(Text, nullable=True)
    secure_coding_changes = Column(Text, nullable=True)
    additional_observations = Column(Text, nullable=True)
    
    score = Column(Float, default=0.0)  # 0 to 10
    admin_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)

    attempt = relationship("Attempt", back_populates="report")
    candidate = relationship("User", foreign_keys=[candidate_id], back_populates="reports")

class EventLog(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"), nullable=False, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    event_type = Column(String, nullable=False, index=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    attempt = relationship("Attempt", back_populates="events")
