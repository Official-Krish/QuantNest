#!/usr/bin/env bash
set -e

API_URL="${API_URL:-http://localhost:3000}"
USER_COUNT="${USER_COUNT:-1000}"

echo "=== Concurrent Sessions Benchmark ==="
echo "Users: $USER_COUNT"
echo ""

# Generate a bcrypt hash for password "Bench123!"
HASH='$2b$10$f3YecZNJdu7K2L9fYhRklutPBUn/pdahUdjCRg6XKqaBNU6TSJ.K2'
TS=$(date +%s)

echo "Creating $USER_COUNT dummy users in MongoDB..."

docker exec quantnest-mongo mongosh myapp --quiet --eval "
  var hash = '$HASH';
  var ts = $TS;
  var docs = [];
  for (var i = 0; i < $USER_COUNT; i++) {
    docs.push({
      username: 'loadtest_' + i + '_' + ts,
      email: 'lt_' + i + '_' + ts + '@test.com',
      password: hash,
      emailVerified: true,
      subscriptionPlan: 'free',
      createdAt: new Date(),
      preferences: { theme: 'Dark', market: 'Indian', broker: 'Paper Trading' },
      notifications: { workflowAlerts: true }
    });
  }
  var r = db.users.insertMany(docs);
  print('Inserted: ' + r.insertedIds.length);
" 2>/dev/null

echo "Launching $USER_COUNT concurrent signins..."

python3 << PYTHON
import subprocess
import time
import threading

TS = $TS
API = "$API_URL"
results = []
errors = []
lock = threading.Lock()
start = time.time()

def signin(i):
    uname = f"loadtest_{i}_{TS}"
    t1 = time.time()
    try:
        r = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
             "-X", "POST", f"{API}/api/v1/user/signin",
             "-H", "Content-Type: application/json",
             "-H", "X-Requested-With: XMLHttpRequest",
             "-d", f'{{"username":"{uname}","password":"Bench123!"}}'],
            capture_output=True, text=True, timeout=60
        )
        elapsed = (time.time() - t1) * 1000
        with lock:
            results.append({"code": r.stdout.strip(), "ms": elapsed})
    except Exception as e:
        with lock:
            errors.append(str(e))

threads = []
for i in range($USER_COUNT):
    t = threading.Thread(target=signin, args=(i,))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

total = time.time() - start

print(f"\nCompleted in {total:.2f}s")
print(f"Responses: {len(results)}, Errors: {len(errors)}")

codes = {}
for r in results:
    codes[r["code"]] = codes.get(r["code"], 0) + 1
print("\nHTTP Status Codes:")
for c, n in sorted(codes.items()):
    print(f"  {c}: {n}")

oks = sorted([r["ms"] for r in results if r["code"] == "200"])
if oks:
    n = len(oks)
    print(f"\nSuccessful ({n}):")
    print(f"  Min:  {oks[0]:.0f}ms")
    print(f"  p50:  {oks[n//2]:.0f}ms")
    print(f"  p95:  {oks[int(n*0.95)]:.0f}ms")
    print(f"  p99:  {oks[int(n*0.99)]:.0f}ms")
    print(f"  Max:  {oks[-1]:.0f}ms")
    print(f"  Mean: {sum(oks)/n:.0f}ms")
    print(f"  Throughput: ~{n/total:.0f} req/s")

all_t = sorted([r["ms"] for r in results])
print(f"\nAll ({len(all_t)}):")
print(f"  p50: {all_t[len(all_t)//2]:.0f}ms")
print(f"  p95: {all_t[int(len(all_t)*0.95)]:.0f}ms")
print(f"  Max: {all_t[-1]:.0f}ms")
PYTHON
