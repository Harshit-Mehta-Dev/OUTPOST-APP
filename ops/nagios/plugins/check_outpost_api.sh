#!/usr/bin/env bash
# ==============================================================================
# Nagios Plugin: check_outpost_api.sh
# Verifies Latency and Health Status of Outpost Node.js backend
# ==============================================================================

TARGET_HOST="${1:-127.0.0.1}"
TARGET_PORT="${2:-5000}"
ENDPOINT="${3:-/api/health}"
URL="http://${TARGET_HOST}:${TARGET_PORT}${ENDPOINT}"

START=$(date +%s%N)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 4 -m 8 "${URL}")
END=$(date +%s%N)

DURATION=$(( (END - START) / 1000000 ))

if [ "$HTTP_CODE" -eq 200 ]; then
    if [ "$DURATION" -gt 3000 ]; then
        echo "WARNING - Outpost API HTTP 200 slow response time ${DURATION}ms | response_time=${DURATION}ms"
        exit 1
    fi
    echo "OK - Outpost API Operational (${DURATION}ms) | response_time=${DURATION}ms"
    exit 0
else
    echo "CRITICAL - Outpost API returned HTTP ${HTTP_CODE} on ${URL} (${DURATION}ms)"
    exit 2
fi
