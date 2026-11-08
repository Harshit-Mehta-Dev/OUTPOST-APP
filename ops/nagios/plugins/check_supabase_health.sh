#!/usr/bin/env bash
# ==============================================================================
# Nagios Plugin: check_supabase_health.sh
# Verifies Supabase Cloud Database REST/Auth responsiveness
# ==============================================================================

SUPABASE_HOST="${1:-idivdegwxgwudgxcuaso.supabase.co}"
URL="https://${SUPABASE_HOST}/rest/v1/"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -m 10 "${URL}")

# A 401 Unauthorized or 200 OK means the Supabase HTTPS Gateway is healthy and receiving calls
if [ "$HTTP_CODE" -eq 401 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo "OK - Supabase Cloud Gateway responsive (HTTP ${HTTP_CODE}) for ${SUPABASE_HOST}"
    exit 0
elif [ "$HTTP_CODE" -eq 000 ]; then
    echo "CRITICAL - Supabase Cloud endpoint unreachable or DNS failure (${SUPABASE_HOST})"
    exit 2
else
    echo "WARNING - Supabase Cloud endpoint returned unexpected HTTP ${HTTP_CODE}"
    exit 1
fi
