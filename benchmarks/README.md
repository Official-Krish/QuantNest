# Benchmarks

Performance benchmarks for QuantNest services. All tests run against a local development environment with Docker (MongoDB + Redis).

## Prerequisites

- Running Docker containers: `docker compose up -d mongodb redis`
- Backend server running: `cd apps/backend && bun index.ts`
- Bun installed

## Quick Start

```bash
# All benchmarks (API + Redis + concurrent)
bash benchmarks/run-all.sh
```

## Individual Benchmarks

### API Latency

```bash
bash benchmarks/run-api-latency.sh
```

Measures p50/p95/p99 response times for the `/api/v1/user/verify` endpoint.

### Concurrent Sessions

```bash
bash benchmarks/run-concurrent-sessions.sh
```

Creates 1000 dummy users and fires 1000 concurrent signin requests. Reports throughput, latency, and error rate.

### Redis Latency

```bash
bash benchmarks/run-redis-latency.sh
```

Measures p50/p95/p99 for 1000 SET and 1000 GET operations.

### AI Framework Overhead

```bash
bun benchmarks/run-ai-overhead.ts
```

Measures Zod input parsing, prompt building, and JSON response parsing overhead (excluding external AI provider call).

## Latest Results (local dev, Mac ARM)

| Metric                          | p50   | p95   | Mean  |
| ------------------------------- | ----- | ----- | ----- |
| API request (no DB)             | 1.0ms | 1.8ms | ~1ms  |
| Concurrent burst (50 req)       | 1.9ms | 17ms  | 4ms   |
| Signin (bcrypt+MongoDB+JWT)     | 89ms  | 104ms | 90ms  |
| Concurrent signins (1000 users) | 8.4s  | 14.6s | 8.4s  |
| Redis SET                       | 3.7ms | 5.3ms | 4.0ms |
| Redis GET                       | 3.5ms | 4.1ms | 3.5ms |
| AI framework overhead           | —     | —     | 61µs  |
