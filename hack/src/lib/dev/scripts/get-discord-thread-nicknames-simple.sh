#!/bin/bash

# Simple script to get Discord nicknames from a thread using curl
# This version uses Python for JSON parsing (no jq dependency)

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
else
  echo "Error: .env.local file not found"
  exit 1
fi

# Check if DISCORD_BOT_TOKEN is set
if [ -z "$DISCORD_BOT_TOKEN" ]; then
  echo "Error: DISCORD_BOT_TOKEN not found in .env.local"
  exit 1
fi

# Thread information from the URL
CHANNEL_ID="1441640326807687318"
API_BASE="https://discord.com/api/v10"

echo "Fetching messages from Discord thread..."
echo ""

# Temporary file to store all messages
MESSAGES_FILE=$(mktemp)
trap "rm -f $MESSAGES_FILE" EXIT

# Fetch messages with pagination
LAST_MESSAGE_ID=""
PAGE=1

while true; do
  if [ -z "$LAST_MESSAGE_ID" ]; then
    URL="${API_BASE}/channels/${CHANNEL_ID}/messages?limit=100"
  else
    URL="${API_BASE}/channels/${CHANNEL_ID}/messages?limit=100&before=${LAST_MESSAGE_ID}"
  fi

  echo "Fetching page ${PAGE}..."

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bot ${DISCORD_BOT_TOKEN}" \
    -H "Content-Type: application/json" \
    "$URL")

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  JSON_RESPONSE=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" != "200" ]; then
    echo "Error: HTTP ${HTTP_CODE}"
    echo "Response: $JSON_RESPONSE"
    exit 1
  fi

  # Append to messages file
  echo "$JSON_RESPONSE" >> "$MESSAGES_FILE"

  # Check message count using Python
  MESSAGE_COUNT=$(echo "$JSON_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

  if [ "$MESSAGE_COUNT" -eq "0" ]; then
    echo "No more messages to fetch."
    break
  fi

  # Get last message ID for pagination
  LAST_MESSAGE_ID=$(echo "$JSON_RESPONSE" | python3 -c "import sys, json; msgs = json.load(sys.stdin); print(msgs[-1]['id'] if msgs else '')" 2>/dev/null || echo "")

  TOTAL=$(python3 -c "import sys, json; 
    msgs = []
    for line in sys.stdin:
      try:
        msgs.extend(json.loads(line))
      except:
        pass
    print(len(msgs))" < "$MESSAGES_FILE" 2>/dev/null || echo "0")

  echo "  Fetched ${MESSAGE_COUNT} messages (total: ${TOTAL})"

  if [ "$MESSAGE_COUNT" -lt 100 ]; then
    break
  fi

  PAGE=$((PAGE + 1))
  sleep 0.5
done

echo ""
echo "Extracting unique nicknames..."
echo ""

# Extract unique nicknames using Python
python3 << 'PYTHON_SCRIPT'
import sys
import json

seen_ids = set()
nicknames = []

try:
    with open('$MESSAGES_FILE', 'r') as f:
        for line in f:
            try:
                messages = json.loads(line.strip())
                for msg in messages:
                    author_id = msg.get('author', {}).get('id', '')
                    if author_id and author_id not in seen_ids:
                        seen_ids.add(author_id)
                        # Try member.nick first, then global_name, then username
                        member = msg.get('member', {})
                        nickname = (
                            member.get('nick') or
                            msg.get('author', {}).get('global_name') or
                            msg.get('author', {}).get('username') or
                            'Unknown'
                        )
                        nicknames.append(nickname)
            except json.JSONDecodeError:
                continue
    
    # Print unique nicknames sorted
    for nickname in sorted(set(nicknames)):
        print(nickname)
except Exception as e:
    print(f"Error processing messages: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

echo ""
echo "Done!"

