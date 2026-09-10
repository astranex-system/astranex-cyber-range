import os
import sys

# Ensure app module is in path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "apps/api")))

from app.database import SessionLocal, engine, Base
from app.models import User, Assessment, Stage, Challenge, Attempt
from app.security import get_password_hash, hash_flag

def seed_database():
    print("[+] Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Create Default Users
        print("[+] Creating seed accounts...")
        admin_user = db.query(User).filter(User.email == "admin@astranex.defence").first()
        if not admin_user:
            admin_user = User(
                email="admin@astranex.defence",
                full_name="Commander Sarah Vance",
                hashed_password=get_password_hash("admin123"),
                role="admin"
            )
            db.add(admin_user)

        # candidate_user creation removed so real candidates register independently
        db.commit()

        # 2. Create Operation Blackout Assessment
        print("[+] Creating Assessment 'Operation Blackout'...")
        assessment = db.query(Assessment).filter(Assessment.name == "Operation Blackout").first()
        if not assessment:
            assessment = Assessment(
                name="Operation Blackout",
                tagline="Investigate. Exploit. Defend.",
                description="An AstraNex autonomous UGV named AX-07 is deployed in a remote operational zone. Investigate the suspected command infrastructure compromise.",
                type="CYBERSECURITY",
                duration_minutes=90,
                total_points=100,
                status="ACTIVE"
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)

        # 3. Create Stages & Challenges
        print("[+] Creating Stages & Challenges...")
        stages_data = [
            {
                "order": 0,
                "name": "MISSION BRIEFING",
                "title": "Incident Briefing: ASTRA-INC-AX07-0926",
                "description": "Review incident context, operational telemetry anomalies, and mission parameters for UGV AX-07.",
                "points": 0,
                "challenge": None
            },
            {
                "order": 1,
                "name": "RECONNAISSANCE",
                "title": "AstraNex Internal Infrastructure Mapping",
                "description": "Discover internal services, telemetry gateway endpoint `/api/telemetry/vehicle/{vehicle_id}`, and version information.",
                "points": 10,
                "challenge": {
                    "title": "Identify Telemetry Gateway Service Endpoint",
                    "description": "Examine internal system documentation to find the telemetry gateway version and endpoint. Submit Flag 1.",
                    "challenge_type": "FLAG",
                    "flag": "FLAG{ASTRANEX_TELEMETRY_GATEWAY_V241_DISCOVERED}",
                    "max_points": 10,
                    "hint_1": "Look closely at the version notes for telemetry-gateway service.",
                    "hint_2": "Search the internal developer repo snapshot for vehicle telemetry endpoints.",
                    "hint_3": "Demo Solution: FLAG{ASTRANEX_TELEMETRY_GATEWAY_V241_DISCOVERED}"
                }
            },
            {
                "order": 2,
                "name": "TELEMETRY API INVESTIGATION",
                "title": "API Tampering & IDOR Vulnerability Analysis",
                "description": "Interact with simulated vehicle API endpoints to detect unauthorized data exposure.",
                "points": 15,
                "challenge": {
                    "title": "API Parameter Tampering Evidence Retrieval",
                    "description": "Identify the API vulnerability exposing vehicle token headers. Submit Flag 2.",
                    "challenge_type": "FLAG",
                    "flag": "FLAG{TELEMETRY_API_IDOR_UNAUTHORIZED_ACCESS_9942}",
                    "max_points": 15,
                    "hint_1": "Look closely at how the API identifies a vehicle request header.",
                    "hint_2": "Compare the requested vehicle ID with the authenticated user's session token.",
                    "hint_3": "Demo Solution: FLAG{TELEMETRY_API_IDOR_UNAUTHORIZED_ACCESS_9942}"
                }
            },
            {
                "order": 3,
                "name": "AUTHENTICATION & AUTHORIZATION",
                "title": "Identity Escalation & Privilege Analysis",
                "description": "Determine which compromised account and privilege scope allowed vehicle command execution.",
                "points": 15,
                "challenge": {
                    "title": "Identify Compromised Identity & Scope",
                    "description": "Investigate the authorization mechanism flaw to extract Flag 3.",
                    "challenge_type": "FLAG",
                    "flag": "FLAG{SVC_TELEMETRY_PRIVILEGE_ESCALATION_EXPOSED}",
                    "max_points": 15,
                    "hint_1": "Inspect service accounts listed in the authorization mapping.",
                    "hint_2": "Identify which role is required for vehicle.command.",
                    "hint_3": "Demo Solution: FLAG{SVC_TELEMETRY_PRIVILEGE_ESCALATION_EXPOSED}"
                }
            },
            {
                "order": 4,
                "name": "LOG FORENSICS",
                "title": "Multi-Log Timeline Reconstruction",
                "description": "Analyze auth.log, gateway.log, telemetry.log, command.log, and system.log to identify attacker IP and commands.",
                "points": 15,
                "challenge": {
                    "title": "Attacker IP & Timeline Correlation",
                    "description": "Correlate event logs to isolate the external attacker IP address. Submit Flag 4.",
                    "challenge_type": "FLAG",
                    "flag": "FLAG{LOG_CORRELATION_ATTACKER_IP_192.168.45.188}",
                    "max_points": 15,
                    "hint_1": "Filter auth.log and gateway.log for anomalous external IP addresses.",
                    "hint_2": "Cross-reference the timestamp 02:14:22Z across all gateway and command logs.",
                    "hint_3": "Demo Solution: FLAG{LOG_CORRELATION_ATTACKER_IP_192.168.45.188}"
                }
            },
            {
                "order": 5,
                "name": "NETWORK INVESTIGATION",
                "title": "PCAP Network Traffic Exfiltration Analysis",
                "description": "Inspect ax07_capture.pcap to trace suspicious C2 communication and exfiltration payloads.",
                "points": 15,
                "challenge": {
                    "title": "Network Packet C2 Identification",
                    "description": "Extract the C2 session token embedded in the HTTP GET payload stream. Submit Flag 5.",
                    "challenge_type": "FLAG",
                    "flag": "FLAG{C2_EXFILTRATION_CHANNEL_IDENTIFIED_8921}",
                    "max_points": 15,
                    "hint_1": "Examine DNS queries for non-standard domain names.",
                    "hint_2": "Follow the HTTP stream on port 8080 to destination IP 192.168.45.188.",
                    "hint_3": "Demo Solution: FLAG{C2_EXFILTRATION_CHANNEL_IDENTIFIED_8921}"
                }
            },
            {
                "order": 6,
                "name": "MALWARE / FILE ANALYSIS",
                "title": "Script De-obfuscation & Persistence Analysis",
                "description": "Analyze simulated script telemetry_update.sh to discover base64 C2 triggers and cron persistence.",
                "points": 10,
                "challenge": {
                    "title": "Extract Cron Persistence & Obfuscated Payload",
                    "description": "Decode the base64 payload and extract the IOC Flag 6.",
                    "challenge_type": "FLAG",
                    "flag": "FLAG{MALWARE_PERSISTENCE_CRON_EXPOSED_4812}",
                    "max_points": 10,
                    "hint_1": "Inspect the cron entry frequency in telemetry_update.sh.",
                    "hint_2": "Decode the base64 string d2dldCBodHRwOi8vMTkyLjE2OC40NS4xODg6ODA4MC9heDA3X2MydHJpZ2dlcg==",
                    "hint_3": "Demo Solution: FLAG{MALWARE_PERSISTENCE_CRON_EXPOSED_4812}"
                }
            },
            {
                "order": 7,
                "name": "SECURE THE SYSTEM",
                "title": "Secure Coding Fix: UGV Command Authorization",
                "description": "Modify the Python authorization function in auth.py to block privilege escalation and pass 10 hidden server tests.",
                "points": 10,
                "challenge": {
                    "title": "Implement Robust Authorization Checks",
                    "description": "Fix the python authorization function so all 10 hidden unit tests pass.",
                    "challenge_type": "CODE",
                    "flag": None,
                    "max_points": 10,
                    "hint_1": "Ensure svc-telemetry is explicitly prevented from COMMAND_EXECUTE action.",
                    "hint_2": "Verify that user object is checked for None and assigned_vehicles mapping.",
                    "hint_3": "Demo Solution: Require 'vehicle.command' role for COMMAND_EXECUTE and check assigned_vehicles."
                }
            },
            {
                "order": 8,
                "name": "FINAL INCIDENT REPORT",
                "title": "Structured Incident Response Report",
                "description": "Submit a structured 11-section Incident Response Report summarizing initial vector, timeline, IOCs, and mitigations.",
                "points": 10,
                "challenge": {
                    "title": "Submit Final Incident Report",
                    "description": "Complete all 11 fields of the structured Incident Response Report for manual admin evaluation.",
                    "challenge_type": "REPORT",
                    "flag": None,
                    "max_points": 10,
                    "hint_1": "Provide detailed findings for initial attack vector and attacker IP.",
                    "hint_2": "Reference specific timestamps from log correlation in Stage 4.",
                    "hint_3": "Demo Solution: Ensure initial vector (IDOR), IP (192.168.45.188), and IOCs are fully detailed."
                }
            }
        ]

        for s_data in stages_data:
            st = db.query(Stage).filter(
                Stage.assessment_id == assessment.id,
                Stage.stage_order == s_data["order"]
            ).first()
            if not st:
                st = Stage(
                    assessment_id=assessment.id,
                    stage_order=s_data["order"],
                    name=s_data["name"],
                    title=s_data["title"],
                    description=s_data["description"],
                    points=s_data["points"]
                )
                db.add(st)
                db.commit()
                db.refresh(st)

            ch_data = s_data["challenge"]
            if ch_data:
                ch = db.query(Challenge).filter(Challenge.stage_id == st.id).first()
                flag_h = hash_flag(ch_data["flag"]) if ch_data["flag"] else None
                if not ch:
                    ch = Challenge(
                        stage_id=st.id,
                        title=ch_data["title"],
                        description=ch_data["description"],
                        challenge_type=ch_data["challenge_type"],
                        flag_hash=flag_h,
                        max_points=ch_data["max_points"],
                        hint_1=ch_data["hint_1"],
                        hint_2=ch_data["hint_2"],
                        hint_3=ch_data["hint_3"]
                    )
                    db.add(ch)
                    db.commit()

        print("[+] Seed complete! Accounts:")
        print("    Admin:     admin@astranex.defence / admin123")
        print("    Candidate: candidate@astranex.defence / candidate123")

    except Exception as e:
        db.rollback()
        print(f"[-] Seeding error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
