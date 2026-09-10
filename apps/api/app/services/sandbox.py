import os
import sys
import tempfile
import subprocess
import time
from typing import Dict, Any

TEST_SUITE_CODE = """
import pytest
from auth import verify_vehicle_command_authorization

def test_valid_authorized_service_account():
    # Authorized vehicle command service account
    user = {"username": "svc-telemetry", "roles": ["telemetry.write"]}
    result = verify_vehicle_command_authorization(user, "AX-07", "TELEMETRY_READ")
    assert result is True, "Authorized telemetry read should pass"

def test_telemetry_write_authorized():
    user = {"username": "ops-admin", "roles": ["vehicle.command"]}
    result = verify_vehicle_command_authorization(user, "AX-07", "TELEMETRY_WRITE")
    assert result is True, "Authorized vehicle commander should write telemetry"

def test_unauthorized_user_vehicle_command_rejected():
    # Unprivileged user trying to execute vehicle command
    user = {"username": "guest-analyst", "roles": ["telemetry.read"]}
    result = verify_vehicle_command_authorization(user, "AX-07", "COMMAND_EXECUTE")
    assert result is False, "Unprivileged user executing vehicle command must be REJECTED"

def test_svc_telemetry_command_execute_privilege_escalation_prevented():
    # svc-telemetry identity had IDOR vulnerability allowing COMMAND_EXECUTE
    user = {"username": "svc-telemetry", "roles": ["telemetry.write"]}
    result = verify_vehicle_command_authorization(user, "AX-07", "COMMAND_EXECUTE")
    assert result is False, "svc-telemetry MUST NOT execute vehicle commands"

def test_missing_roles_rejected():
    user = {"username": "unknown"}
    result = verify_vehicle_command_authorization(user, "AX-07", "TELEMETRY_READ")
    assert result is False, "User with missing roles must be rejected"

def test_admin_full_access():
    user = {"username": "sysadmin", "roles": ["admin", "vehicle.command"]}
    result = verify_vehicle_command_authorization(user, "AX-07", "COMMAND_EXECUTE")
    assert result is True, "Sysadmin with vehicle.command role must be authorized"

def test_mismatched_vehicle_id_rejected():
    user = {"username": "ops-admin", "roles": ["vehicle.command"], "assigned_vehicles": ["AX-01"]}
    result = verify_vehicle_command_authorization(user, "AX-07", "COMMAND_EXECUTE")
    assert result is False, "Accessing unassigned vehicle ID must be rejected"

def test_empty_user_object_rejected():
    result = verify_vehicle_command_authorization(None, "AX-07", "TELEMETRY_READ")
    assert result is False, "None user object must be safely rejected"

def test_invalid_action_type_rejected():
    user = {"username": "sysadmin", "roles": ["admin"]}
    result = verify_vehicle_command_authorization(user, "AX-07", "INVALID_ACTION")
    assert result is False, "Invalid action types must be rejected"

def test_token_revocation_check():
    user = {"username": "revoked_user", "roles": ["vehicle.command"], "is_revoked": True}
    result = verify_vehicle_command_authorization(user, "AX-07", "TELEMETRY_READ")
    assert result is False, "Revoked user sessions must be rejected"
"""

def run_code_in_sandbox(submitted_code: str, timeout_seconds: int = 5) -> Dict[str, Any]:
    """
    Executes submitted Python code safely against hidden pytest suite in a temp sandbox.
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        auth_file_path = os.path.join(temp_dir, "auth.py")
        test_file_path = os.path.join(temp_dir, "test_suite.py")
        
        # Write candidate code
        with open(auth_file_path, "w", encoding="utf-8") as f:
            f.write(submitted_code)
            
        # Write hidden pytest suite
        with open(test_file_path, "w", encoding="utf-8") as f:
            f.write(TEST_SUITE_CODE)
            
        # Run pytest inside isolated subprocess
        cmd = [sys.executable, "-m", "pytest", test_file_path, "-v", "--tb=short"]
        
        start_time = time.time()
        try:
            process = subprocess.Popen(
                cmd,
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(timeout=timeout_seconds)
            execution_time = time.time() - start_time
            
            output = stdout + "\n" + stderr
            
            # Parse test results from stdout
            passed_count = 0
            total_count = 10  # 10 test cases in suite
            
            for line in output.splitlines():
                if "PASSED" in line:
                    passed_count += 1
                    
            score_awarded = round((passed_count / total_count) * 10.0, 1)
            
            return {
                "tests_passed": passed_count,
                "tests_total": total_count,
                "passed_all": passed_count == total_count,
                "score_awarded": score_awarded,
                "output": output,
                "execution_time_seconds": round(execution_time, 3)
            }
            
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                "tests_passed": 0,
                "tests_total": 10,
                "passed_all": False,
                "score_awarded": 0.0,
                "output": f"Execution Timed Out (> {timeout_seconds} seconds). Potential infinite loop detected.",
                "execution_time_seconds": timeout_seconds
            }
        except Exception as e:
            return {
                "tests_passed": 0,
                "tests_total": 10,
                "passed_all": False,
                "score_awarded": 0.0,
                "output": f"Sandbox execution error: {str(e)}",
                "execution_time_seconds": 0.0
            }
