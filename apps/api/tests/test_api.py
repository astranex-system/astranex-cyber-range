import sys
import os
import pytest
from fastapi.testclient import TestClient

# Ensure app is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database import SessionLocal
from app.models import User, Attempt, Stage, Challenge, Submission

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ONLINE"

def get_test_candidate_token():
    email = "test_candidate_unit@astranex.defence"
    # Try register first
    res = client.post("/api/auth/register", json={"email": email, "password": "candidate123", "full_name": "Test Candidate"})
    if res.status_code == 200:
        return res.json()["access_token"]
    # Fallback to login
    res = client.post("/api/auth/login", json={"email": email, "password": "candidate123"})
    return res.json().get("access_token")

def test_login_candidate_success():
    email = "test_candidate_login@astranex.defence"
    reg_res = client.post("/api/auth/register", json={"email": email, "password": "candidate123", "full_name": "Login Candidate"})
    assert reg_res.status_code == 200
    assert "access_token" in reg_res.json()
    assert reg_res.json()["role"] == "candidate"

def test_login_admin_success():
    response = client.post("/api/auth/login", json={"email": "admin@astranex.defence", "password": "admin123"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "admin"

def test_login_invalid_credentials():
    response = client.post("/api/auth/login", json={"email": "admin@astranex.defence", "password": "wrongpassword"})
    assert response.status_code == 401

def test_stage_progression_locking():
    token = get_test_candidate_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Start assessment
    res = client.post("/api/assessment/start", headers=headers)
    assert res.status_code == 200

    # Try requesting stage 4 log without completing earlier stages
    res = client.get("/api/challenges/stage4/logs?log_name=auth.log", headers=headers)
    assert res.status_code == 403
    assert "Stage 4 is locked" in res.json()["detail"]

def test_flag_submission_and_stage_unlock():
    token = get_test_candidate_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Start assessment & acknowledge briefing
    client.post("/api/assessment/start", headers=headers)
    client.post("/api/assessment/acknowledge_briefing", headers=headers)

    # Get stages
    res = client.get("/api/stages", headers=headers)
    stages = res.json()
    recon_stage = [s for s in stages if s["stage_order"] == 1][0]
    ch_id = recon_stage["challenges"][0]["id"]

    # Submit wrong flag
    res = client.post(f"/api/challenges/{ch_id}/submit", headers=headers, json={"challenge_id": ch_id, "flag": "FLAG{INVALID_FLAG}"})
    assert res.status_code == 200
    assert res.json()["is_correct"] is False

    # Submit correct flag 1
    res = client.post(f"/api/challenges/{ch_id}/submit", headers=headers, json={"challenge_id": ch_id, "flag": "FLAG{ASTRANEX_TELEMETRY_GATEWAY_V241_DISCOVERED}"})
    assert res.status_code == 200
    assert res.json()["is_correct"] is True
    assert res.json()["stage_unlocked"] == 2
