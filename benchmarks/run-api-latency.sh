#!/usr/bin/env bash
set -e

API_URL="${API_URL:-http://localhost:3000}"
REQUESTS="${REQUESTS:-200}"

echo "=== API Latency Benchmark ==="
echo "Endpoint: $API_URL/api/v1/user/verify"
echo "Requests: $REQUESTS"
echo ""

# Warmup
echo "Warming up (50 requests)..."
for i in $(seq 1 50); do
  curl -s -o /dev/null "$API_URL/api/v1/user/verify" 2>/dev/null
done

TIMEFILE=$(mktemp)
echo "Benchmarking..."
for i in $(seq 1 "$REQUESTS"); do
  curl -s -o /dev/null -w "%{time_total}\n" "$API_URL/api/v1/user/verify" 2>/dev/null >> "$TIMEFILE"
done

python3 -c "
vals = []
with open('$TIMEFILE') as f:
    for line in f:
        line = line.strip()
        if line: vals.append(float(line) * 1000)
vals.sort()
n = len(vals)
if n == 0:
    print('No data collected')
    exit(1)
min_v = min(vals)
max_v = max(vals)
mean = sum(vals) / n
p50 = vals[int(n * 0.5)]
p95 = vals[int(n * 0.95)]
p99 = vals[int(n * 0.99)]
print(f'Requests: {n}')
print(f'  Min:  {min_v:.2f}ms')
print(f'  p50:  {p50:.2f}ms')
print(f'  p95:  {p95:.2f}ms')
print(f'  p99:  {p99:.2f}ms')
print(f'  Max:  {max_v:.2f}ms')
print(f'  Mean: {mean:.2f}ms')
"

rm -f "$TIMEFILE"
