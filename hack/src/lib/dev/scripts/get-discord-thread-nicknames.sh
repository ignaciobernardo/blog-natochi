#!/bin/bash

# Script to get all Discord nicknames from a thread
# Usage: ./get-discord-thread-nicknames.sh

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
# https://discord.com/channels/1439366811979223345/1441640326807687318
GUILD_ID="1439366811979223345"
CHANNEL_ID="1441640326807687318"

# Discord API base URL
API_BASE="https://discord.com/api/v10"

# Temporary file to store all messages
MESSAGES_FILE=$(mktemp)
trap "rm -f $MESSAGES_FILE" EXIT

echo "Fetching messages from thread ${CHANNEL_ID}..."
echo ""

# Fetch messages with pagination
# Discord API returns up to 100 messages per request
# We'll paginate using the 'before' parameter
LAST_MESSAGE_ID=""
PAGE=1

while true; do
  if [ -z "$LAST_MESSAGE_ID" ]; then
    # First request - get latest messages
    URL="${API_BASE}/channels/${CHANNEL_ID}/messages?limit=100"
  else
    # Subsequent requests - get messages before the last message ID
    URL="${API_BASE}/channels/${CHANNEL_ID}/messages?limit=100&before=${LAST_MESSAGE_ID}"
  fi

  echo "Fetching page ${PAGE}..."

  # Make API request
  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bot ${DISCORD_BOT_TOKEN}" \
    -H "Content-Type: application/json" \
    "$URL")

  # Extract HTTP status code (last line)
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  # Extract JSON response (all but last line)
  JSON_RESPONSE=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" != "200" ]; then
    echo "Error: HTTP ${HTTP_CODE}"
    echo "Response: $JSON_RESPONSE"
    exit 1
  fi

  # Parse messages array
  MESSAGES=$(echo "$JSON_RESPONSE" | jq -r '.[]')

  # Check if we got any messages
  MESSAGE_COUNT=$(echo "$JSON_RESPONSE" | jq 'length')
  
  if [ "$MESSAGE_COUNT" -eq 0 ]; then
    echo "No more messages to fetch."
    break
  fi

  # Append messages to file
  echo "$JSON_RESPONSE" >> "$MESSAGES_FILE"

  # Get the ID of the oldest message in this batch for pagination
  LAST_MESSAGE_ID=$(echo "$JSON_RESPONSE" | jq -r '.[-1].id')

  echo "  Fetched ${MESSAGE_COUNT} messages (total so far: $(jq 'length' < "$MESSAGES_FILE"))"

  # If we got less than 100 messages, we've reached the end
  if [ "$MESSAGE_COUNT" -lt 100 ]; then
    break
  fi

  PAGE=$((PAGE + 1))
  
  # Small delay to avoid rate limiting
  sleep 0.5
done

echo ""
echo "Processing messages to extract nicknames..."
echo ""

# Extract unique nicknames
# Discord messages have a 'member' object with 'nick' field for guild nicknames
# If no nickname, fall back to 'author.username' or 'author.global_name'
jq -r '
  .[] | 
  .author.id as $authorId |
  .member.nick // .author.global_name // .author.username as $nickname |
  "\($authorId)|\($nickname)"
' < "$MESSAGES_FILE" | \
sort -u | \
awk -F'|' '{
  if (!seen[$1]++) {
    nicknames[$1] = $2
  }
} END {
  for (id in nicknames) {
    print nicknames[id]
  }
}' | \
sort

echo ""
echo "Done!"

