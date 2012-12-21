echo "$MOCK_KEY" > /tmp/ms_key
echo "$MOCK_PUB" > /tmp/ms_key.pub

exec ssh -i "/tmp/ms_key" -o "StrictHostKeyChecking no" "$@"
