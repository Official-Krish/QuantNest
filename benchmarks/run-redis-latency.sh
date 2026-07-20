#!/usr/bin/env bash
set -e

REDIS_HOST="${REDIS_HOST:-localhost}"
REQUESTS="${REQUESTS:-1000}"

echo "=== Redis Latency Benchmark ==="
echo "Host: $REDIS_HOST:6379"
echo "Operations: $REQUESTS SET + $REQUESTS GET"
echo ""

SETFILE=$(mktemp)
GETFILE=$(mktemp)

# Warmup
redis-cli -h "$REDIS_HOST" -p 6379 SET bench:warmup "x" 2>/dev/null
redis-cli -h "$REDIS_HOST" -p 6379 GET bench:warmup 2>/dev/null

echo "Benchmarking SET..."
for i in $(seq 1 "$REQUESTS"); do
  T1=$(date +%s%N)
  redis-cli -h "$REDIS_HOST" -p 6379 SET "bench:set:$i" "value$i" EX 3600 2>/dev/null
  T2=$(date +%s%N)
  echo "$((T2 - T1))" >> "$SETFILE"
done

echo "Benchmarking GET..."
for i in $(seq 1 "$REQUESTS"); do
  T1=$(date +%s%N)
  redis-cli -h "$REDIS_HOST" -p 6379 GET "bench:set:$i" 2>/dev/null
  T2=$(date +%s%N)
  echo "$((T2 - T1))" >> "$GETFILE"
done

# Cleanup
for i in $(seq 1 "$REQUESTS"); do
  redis-cli -h "$REDIS_HOST" -p 6379 DEL "bench:set:$i" 2>/dev/null
done

python3 -c "
import sys

for label, path in [('SET', '$SETFILE'), ('GET', '$GETFILE')]:
    vals = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line:
                vals.append(int(line) / 1000000)
    vals.sort()
    n = len(vals)
    if n == 0:
        print(f'{label}: no data')
        continue
    print(f'{label} ({n} ops):')
    print(f'  Min:  {min(vals):.2f}ms')
    print(f'  p50:  {vals[n//2]:.2f}ms')
    print(f'  p95:  {vals[int(n*0.95)]:.2f}ms')
    print(f'  p99:  {vals[int(n*0.99)]:.2f}ms')
    print(f'  Max:  {max(vals):.2f}ms')
    print(f'  Mean: {sum(vals)/n:.2f}ms')
    print()
"

rm -f "$SETFILE" "$GETFILE"
