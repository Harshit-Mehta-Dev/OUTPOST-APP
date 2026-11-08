#!/usr/bin/env bash
# ==============================================================================
# Nagios Plugin: check_dismw_security.sh
# Validates D.I.S.M.W Frontier Security Aegis State
# ==============================================================================

TARGET_HOST="${1:-127.0.0.1}"
TARGET_PORT="${2:-5000}"
URL="http://${TARGET_HOST}:${TARGET_PORT}/api/security/dismw/wall-status"

RES=$(curl -s --connect-timeout 5 -m 10 "${URL}")

if [ -z "$RES" ]; then
    echo "CRITICAL - D.I.S.M.W Wall endpoint unreachable at ${URL}"
    exit 2
fi

STATUS=$(echo "$RES" | grep -o '"defenseStatus":"[^"]*"' | cut -d'"' -f4)
ENGINE=$(echo "$RES" | grep -o '"engine":"[^"]*"' | cut -d'"' -f4)

if [ "$STATUS" == "ARMED_AEGIS" ]; then
    echo "OK - D.I.S.M.W (${ENGINE}) is ARMED_AEGIS | defense_status=1"
    exit 0
elif [ "$STATUS" == "DEGRADED" ]; then
    echo "WARNING - D.I.S.M.W Security Aegis state degraded: ${STATUS} | defense_status=2"
    exit 1
else
    echo "CRITICAL - D.I.S.M.W Security Aegis breached or offline (Status: ${STATUS:-UNKNOWN}) | defense_status=0"
    exit 2
fi
