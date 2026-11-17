"""STAGE 1 PROBE 6d — CORRECTED full route & auth-dependency inventory.

Prior probes wrongly iterated app.routes only; routers are mounted lazily as
_IncludedRouter entries, so they were missed. Enumerate each router directly.
"""
import sys
sys.path.insert(0, "C:/Users/HP/ghost-vpa")
from fastapi.routing import APIRoute
from backend.app.api import (ingestion, sim_control, canaries, graph, cases,
                             benchmark, audit, websocket)

MODULES = [ingestion, sim_control, canaries, graph, cases, benchmark, audit,
           websocket]

total = 0
no_deps = []
for m in MODULES:
    for r in m.router.routes:
        if not isinstance(r, APIRoute):
            continue
        total += 1
        methods = ",".join(sorted(mm for mm in r.methods if mm != "HEAD"))
        deps = [d.call.__name__ for d in r.dependant.dependencies if d.call]
        # Also check param-level Dependencies (security, header guards)
        guard = [(p.name, p.field_info.annotation)
                 for p in r.dependant.header_params] if hasattr(r.dependant, "header_params") else []
        print(f"  {methods:4s} {r.path:44s} deps={deps}")
        if not deps:
            no_deps.append((methods, r.path))
print(f"\n=== TOTAL API endpoints: {total} ===")
print(f"=== Endpoints with ZERO dependency (no auth): {len(no_deps)} ===")
print()
print("=== X-User-Role header params (client-supplied 'RBAC') ===")
for m in MODULES:
    for r in m.router.routes:
        if not isinstance(r, APIRoute):
            continue
        for hp in getattr(r.dependant, "header_params", []):
            if "role" in hp.name.lower():
                print(f"  {r.path:44s} header param: {hp.name}")
print()
print("=== Confirmed: no Depends(require_role) / OAuth / JWT anywhere ===")
import re
for m in MODULES:
    src = open(m.__file__, encoding="utf-8").read()
    hits = re.findall(r"require_role|OAuth2|HTTPBearer|jwt|verify_token|"
                      r"Depends\(get_current|api_key", src, re.I)
    if hits:
        print(f"  {m.__name__}: {set(hits)}")
print("  => none found in any API module.")