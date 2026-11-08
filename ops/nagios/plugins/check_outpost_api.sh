#!/usr/bin/env bash
# ==============================================================================
# Nagios Plugin: check_outpost_api.sh
# Verifies Latency and Health Status of Outpost backend (HTTPS Render / HTTP local)
# ==============================================================================

TARGET_HOST="${1:-outpost-app.onrender.com}"
ENDPOINT="${2:-/api/health}"

if [[ "$TARGET_HOST" == *"onrender.com"* ]] || [[ "$TARGET_HOST" == *"https://"* ]]; then
    CLEAN_HOST=$(echo "$TARGET_HOST" | sed 's|http[s]*://||')
    URL="https://${CLEAN_HOST}${ENDPOINT}"
else
    URL="http://${TARGET_HOST}:5000${ENDPOINT}"
fi

START=$(date +%s%N 2>/dev/null || date +%s)
HTTP_CODE=$(curl -s -k -o /dev/null -w "%{http_code}" --connect-timeout 5 -m 10 "${URL}")
END=$(date +%s%N 2>/dev/null || date +%s)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "OK - Outpost API Operational (HTTP 200) on ${URL}"
    exit 0
else
    echo "CRITICAL - Outpost API returned HTTP ${HTTP_CODE} on ${URL}"
    exit 2
fi
