# AstraNex Defence UGV Command Subsystem Authorization Logic
# Vulnerability Notice: IDOR & Scope Enforcement Flaw in AX-07 Telemetry Service

def verify_vehicle_command_authorization(user: dict, vehicle_id: str, action: str) -> bool:
    """
    Verifies whether the given user context is authorized to perform 'action'
    on the target UGV 'vehicle_id'.
    
    Candidate Task:
    Fix the authorization checks to prevent unauthorized users (including 'svc-telemetry')
    from executing 'COMMAND_EXECUTE' actions, while retaining valid access for sysadmins.
    """
    if not user:
        return False
        
    if user.get("is_revoked", False):
        return False
        
    roles = user.get("roles", [])
    username = user.get("username", "")
    assigned_vehicles = user.get("assigned_vehicles", None)
    
    # Check vehicle assignment scope if specified
    if assigned_vehicles is not None and vehicle_id not in assigned_vehicles:
        return False
        
    # VULNERABLE CODE IN STAGE 3/7:
    # 'svc-telemetry' service account was permitted to execute commands due to missing role check
    if action == "TELEMETRY_READ":
        return "telemetry.read" in roles or "telemetry.write" in roles or "admin" in roles
        
    if action == "TELEMETRY_WRITE":
        return "telemetry.write" in roles or "vehicle.command" in roles or "admin" in roles

    if action == "COMMAND_EXECUTE":
        # BUG: Currently allows svc-telemetry or any telemetry user if header was present!
        # MUST ONLY ALLOW users with 'vehicle.command' role AND NOT svc-telemetry service account!
        if "vehicle.command" in roles:
            return True
        return False

    return False
