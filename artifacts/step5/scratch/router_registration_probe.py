"""STAGE 1 PROBE 6c — resolve the 'only 5 routes' anomaly.

Is it (a) a probe artifact, or (b) routers genuinely not registered?
"""
import sys
sys.path.insert(0, "C:/Users/HP/ghost-vpa")
from fastapi.routing import APIRoute
from backend.app.main import app

print(f"app.routes length: {len(app.routes)}")
print("--- all entries ---")
for r in app.routes:
    print(f"  {type(r).__name__:20s} path={getattr(r, 'path', '?')}")
print()

from backend.app.api import ingestion, sim_control, canaries, graph, cases, benchmark, audit
mods = [ingestion, sim_control, canaries, graph, cases, benchmark, audit]
for m in mods:
    n = len(m.router.routes)
    print(f"  {m.__name__:38s} router.routes={n}")
print()

print("=== Test an actual endpoint, not just preflight ===")
from fastapi.testclient import TestClient
c = TestClient(app)
for ep in ["/healthz", "/api/v1/sim/status", "/api/v1/audit/verify"]:
    try:
        rr = c.get(ep)
        body = rr.text[:90].replace("\n", " ")
        print(f"  GET {ep:28s} -> {rr.status_code}  {body}")
    except Exception as e:
        print(f"  GET {ep:28s} -> RAISED {type(e).__name__}: {e}")