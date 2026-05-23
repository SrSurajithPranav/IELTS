#!/usr/bin/env bash
# Script: run_generate_review_quizzes.sh
# Usage: ADMIN_JWT=<token> ./run_generate_review_quizzes.sh [count]
# This calls the admin bulk endpoint to create review quizzes for all students with mistakes.

API_URL=${API_URL:-http://localhost:5000/api}
COUNT=${1:-8}
MIN_FREQ=${2:-0}
CATEGORY=${3:-}

if [ -z "$ADMIN_JWT" ]; then
  echo "Error: set ADMIN_JWT environment variable to a valid admin JWT token"
  exit 2
fi

PAYLOAD=$(jq -n --argjson c $COUNT --argjson m $MIN_FREQ --arg cat "$CATEGORY" '{count: $c, min_frequency: $m} + (if ($cat|length) > 0 then {category: $cat} else {} end)')

curl -s -X POST "$API_URL/quizzes/mistakes/create-bulk" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq '.'
