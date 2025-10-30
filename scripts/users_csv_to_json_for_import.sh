#!/bin/bash

# Check for arguments
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <csv_file_path> <starting_user_id>"
  exit 1
fi

CSV_FILE="$1"
START_ID="$2"

# Check if file exists
if [ ! -f "$CSV_FILE" ]; then
  echo "Error: File '$CSV_FILE' not found!"
  exit 1
fi

USER_ID=$START_ID
JSON_ARRAY="["

while IFS=',' read -r user_type user_phone_no user_email; do
  user_password="$user_phone_no"
  user_name="$user_email"
  user_age=30
  v=0

  user_json=$(jq -n \
    --arg user_name "$user_name" \
    --arg user_password "$user_password" \
    --arg user_type "$user_type" \
    --arg user_phone_no "$user_phone_no" \
    --arg user_email "$user_email" \
    --argjson user_age "$user_age" \
    --argjson user_id "$USER_ID" \
    --argjson __v "$v" \
    '{
      user_name: $user_name,
      user_password: $user_password,
      user_type: $user_type,
      user_phone_no: $user_phone_no,
      user_email: $user_email,
      list_of_visits: [],
      user_age: $user_age,
      user_id: $user_id,
      __v: $__v
    }'
  )

  JSON_ARRAY+="$user_json,"
  USER_ID=$((USER_ID + 1))
done < "$CSV_FILE"

# Remove trailing comma and close array
JSON_ARRAY="${JSON_ARRAY%,}]"

# Output JSON
echo "$JSON_ARRAY"
