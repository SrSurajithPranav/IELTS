#!/usr/bin/env bash
# Script: run_generate_review_quizzes.sh
# Usage: ADMIN_JWT=<token> ./run_generate_review_quizzes.sh [count]
# This calls the admin bulk endpoint to create review quizzes for all students with mistakes.

API_URL=${API_URL:-http://localhost:5000/api}
COUNT=${1:-8}
MIN_FREQ=${2:-0}
CATEGORY=${3:-}

if [ -z "$ADMIN_JWT" ] && [ -z "$JOB_TOKEN" ]; then
  echo "Error: set ADMIN_JWT or JOB_TOKEN environment variable to authenticate"
  exit 2
fi

PAYLOAD=$(jq -n --argjson c $COUNT --argjson m $MIN_FREQ --arg cat "$CATEGORY" '{count: $c, min_frequency: $m} + (if ($cat|length) > 0 then {category: $cat} else {} end)')

if [ -n "$JOB_TOKEN" ]; then
  curl -s -X POST "$API_URL/quizzes/mistakes/create-bulk" \
    -H "X-JOB-TOKEN: $JOB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" | jq '.'
else
  curl -s -X POST "$API_URL/quizzes/mistakes/create-bulk" \
    -H "Authorization: Bearer $ADMIN_JWT" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" | jq '.'
fi
