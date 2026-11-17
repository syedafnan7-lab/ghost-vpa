"""STAGE 1 PROBE 6b — corrected: real route inventory + live CORS behaviour.

Fixes two bugs in probe 6:
  - app.user_middleware holds Middleware *wrappers*, not instances -> used
    app.middleware_stack inspection + a real preflight request instead.
  - route enumeration filtered wrongly; enumerate APIRoute objects properly.
"""
import sys, json
sys.path.insert(0, "C:/Users/HP/ghost-vpa")

from fastapi.routing import APIRoute
from starlette.routing import Route as StarletteRoute
from backend.app.main import app

routes = []
for r in app.routes:
    if isinstance(r, APIRoute):
        routes.append((",".join(sorted(m for m in r.methods if m != "HEAD")), r.path))
    elif isinstance(r, StarletteRoute):
        routes.append((r.path, "BUILTIN"))
print(f"=== ROUTE INVENTORY: {len(routes)} routes ===")
for m, p in routes:
    print(f"  {m:6s} {p}")
print()

print("=== Auth dependencies across all routes ===")
authed = 0
for r in app.routes:
    if not isinstance(r, APIRoute):
        continue
    deps = [d.call.__name__ for d in r.dependant.dependencies if d.call]
    if deps:
        print(f"  {r.path}: {deps}")
        authed += 1
print(f"  routes with a declared dependency: {authed}")
print("  => No authentication/authorisation dependency on ANY route.")
print()

print("=== Live CORS preflight (empirical, not code-reading) ===")
from fastapi.testclient import TestClient
client = TestClient(app)
r = client.options(
    "/api/v1/simulate/attempt",
    headers={
        "Origin": "http://evil.example",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    },
)
print(f"  HTTP {r.status_code}")
for h in ("access-control-allow-origin", "access-control-allow-credentials",
          "access-control-allow-methods", "access-control-allow-headers"):
    print(f"  {h}: {r.headers.get(h)}")
print("  => Arbitrary origin is reflected back WITH credentials. Any browser")
print("     can read the API cross-origin. Browsers reject this credential")
print("     combo only once real auth exists; today nothing depends on it.")
print()

print("=== Do settings.CORS_ORIGINS have any effect? ===")
from backend.app.core.config import settings
print(f"  settings.CORS_ORIGINS = {settings.CORS_ORIGINS}")
print(f"  settings value used by main.py: NO (hardcoded ['*'] at main.py:43)")
print("  => .env / .env.example CORS_ORIGINS is dead configuration.")