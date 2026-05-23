#!/usr/bin/env bash
# Script: run_generate_review_quizzes.sh
# Usage: ADMIN_JWT=<token> ./run_generate_review_quizzes.sh [count]
# This calls the admin bulk endpoint to create review quizzes for all students with mistakes.

API_URL=${API_URL:-http://localhost:5000/api}
COUNT=${1:-8}
if [ -z "$ADMIN_JWT" ]; then
  echo "Error: set ADMIN_JWT environment variable to a valid admin JWT token"
  exit 2
fi

curl -s -X POST "$API_URL/quizzes/mistakes/create-bulk" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "{ \"count\": $COUNT }" | jq '.'
