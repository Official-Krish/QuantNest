#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo "============================================"
echo "  QuantNest Benchmark Suite"
echo "============================================"
echo ""

# 1. API Latency
echo "────────────────────────────────────────────"
bash "$ROOT/benchmarks/run-api-latency.sh"
echo ""

# 2. Redis Latency
echo "────────────────────────────────────────────"
bash "$ROOT/benchmarks/run-redis-latency.sh"
echo ""

# 3. AI Framework Overhead
echo "────────────────────────────────────────────"
bun "$ROOT/benchmarks/run-ai-overhead.ts"
echo ""

# 4. Concurrent Sessions (optional, requires auth rate limits to be lifted)
echo "────────────────────────────────────────────"
echo "Skipping concurrent sessions benchmark"
echo "(requires temporarily disabling auth rate limiters)"
echo "Run manually: bash benchmarks/run-concurrent-sessions.sh"
echo ""

echo "============================================"
echo "  Done"
echo "============================================"
