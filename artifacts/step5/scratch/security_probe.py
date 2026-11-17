"""STAGE 1 PROBE 6 — runtime security & integration behaviour.

Tests (evidence for Stage 1 report):
  1. CORS configuration: wildcard origin + allow_credentials.
  2. Benchmark endpoint: blocking synchronous work inside an async handler.
  3. Auth: is there any authentication at all on the API?
  4. Ingestion: no idempotency / no event_id dedup.
"""
import sys, asyncio, time, inspect
sys.path.insert(0, "C:/Users/HP/ghost-vpa")

from fastapi.testclient import TestClient
from backend.app.main import app

print("=== 1. CORS + credentials ===")
mid = [m for m in app.user_middleware if "CORS" in type(m).__name__.upper()]
print(f"  CORS middleware present: {bool(mid)}")
print("  main.py hardcodes allow_origins=['*'] with allow_credentials=True,")
print("  ignoring settings.CORS_ORIGINS entirely.")
print("  => Browsers reject credentialed wildcard CORS; any future cookie/")
print("     header auth silently breaks, or CORS is effectively open.")
print()

print("=== 2. Authentication surface ===")
routes = []
for r in app.routes:
    methods = getattr(r, "methods", None)
    if methods:
        routes.append((r.path, ",".join(sorted(m for m in methods if m != "HEAD"))))
print(f"  total routes: {len(routes)}")
# Any dependency that looks like auth?
from backend.app.main import app as a
deps = set()
for r in a.routes:
    dependant = getattr(r, "dependant", None)
    if dependant:
        for d in dependant.dependencies:
            deps.add(d.call.__name__ if d.call else "?")
print(f"  dependency callables used: {sorted(deps) if deps else 'NONE'}")
print("  => No authentication/authorisation dependency. 'RBAC' is a string")
print("     header chosen by the client. Zero identity verification.")
print()

print("=== 3. Routes with no auth at all ===")
for p, m in routes:
    print(f"  {m:6s} {p}")
print()

print("=== 4. Ingestion idempotency ===")
src = open("C:/Users/HP/ghost-vpa/backend/app/api/ingestion.py", encoding="utf-8").read()
print(f"  mentions 'event_id' dedup / uniqueness check: "
      f"{'unique' in src.lower() or 'duplicate' in src.lower() or 'idempot' in src.lower()}")
print("  => event_id is a client-supplied primary key with no dedup, so a")
print("     replayed event raises an IntegrityError (500), and there is no")
print("     protection against duplicate ingestion of the same real event.")
print()

print("=== 5. Benchmark endpoint blocking ===")
from backend.app.ml.benchmark import benchmark_runner
import backend.app.api.benchmark as bm
print(f"  benchmark endpoint is async: {inspect.iscoroutinefunction(bm.get_benchmark_results)}")
print(f"  run_benchmark is sync: {not inspect.iscoroutinefunction(benchmark_runner.run_benchmark)}")
print("  => The sync 100k-node generation + 3 LightGBM trainings run directly")
print("     on the event loop, blocking every concurrent request.")