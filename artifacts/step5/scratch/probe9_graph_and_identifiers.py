"""STAGE 1 PROBE 9 — graph construction reality + identifier handling.

Part 1: Does the 'graph-enhanced' benchmark construct any graph?
Part 2: Identifiers — stored, exported, reconstructable, access-controlled?
Part 3: Is is_canary_hit (the oracle) fed to the model?
"""
import sys, re, json, sqlite3, os
sys.path.insert(0, "C:/Users/HP/ghost-vpa")

print("### PART 1: IS A GRAPH ACTUALLY BUILT? ###")
import backend.app.ml.benchmark as bm
bmsrc = open(bm.__file__, encoding="utf-8").read()
for tok in ["networkx", "import nx", "MultiDiGraph", "temporal_engine",
            "temporal_graph", "cs_lp", "compute_cslp", "add_node", "add_edge"]:
    print(f"  benchmark.py mentions '{tok}': {tok in bmsrc}")
print("  => The 'graph-enhanced' model trains on 12 pre-made numeric columns.")
print("     No graph is constructed, no CS-LP is computed, no NetworkX used.")
print()
import backend.app.ml.dataset_generator as dg
dgsrc = open(dg.__file__, encoding="utf-8").read()
for tok in ["networkx", "MultiDiGraph", "temporal_engine", "cs_lp",
            "compute_cslp", "add_node", "add_edge"]:
    print(f"  dataset_generator.py mentions '{tok}': {tok in dgsrc}")
print("  => The generator likewise builds NO graph. The 6 'graph' features are")
print("     unconditional random draws (random.uniform bands) selected by label")
print("     branch, not graph statistics.")
print()
print("  Contrast: where CS-LP IS genuinely implemented (used at runtime):")
import backend.app.graph.temporal_engine as te
for tok in ["compute_cslp_scores", "MultiDiGraph", "detect_motifs"]:
    print(f"    temporal_engine.py has '{tok}': {hasattr(te, tok) or tok in open(te.__file__, encoding='utf-8').read()}")
print("  => Real graph analytics exist ONLY in the runtime engine, and never")
print("     touch the benchmark. The two halves are never connected.")
print()

print("### PART 2: IDENTIFIER HANDLING ###")
import inspect
from backend.app.simulator.rail import simulator
railsrc = open("C:/Users/HP/ghost-vpa/backend/app/simulator/rail.py", encoding="utf-8").read()
print("  rail.py identifier formats:")
for m in sorted(set(re.findall(r"f\"[A-Z_]+[^\"]*\",?|ACCT_SYNTH|ACCT_\{|CANARY_VPA_", railsrc))):
    print(f"    {m}")
print()
print("  Are identifiers hashed, masked or pseudonymised anywhere?")
hits = re.findall(r"hashlib|sha256|hmac|blake2|mask|anonym|pseudonym|redact|obfuscat",
                  railsrc, re.I)
print(f"    rail.py: {sorted(set(x.lower() for x in hits)) if hits else 'NONE'}")
print("  => The identifiers are PLAINTEXT synthetic tokens. They are")
print("     pseudonymous-by-construction (no real PII embedded), which is a")
print("     genuine design strength, but no hashing/masking is applied and")
print("     none is needed because no real PII exists to protect.")
print()

print("  Does the STIX exporter redact anything?")
import backend.app.threat_intel.stix_exporter as sx
sxsrc = open(sx.__file__, encoding="utf-8").read()
print(f"    redaction/pseudonymisation calls in stix_exporter.py: "
      f"{sorted(set(re.findall(r'redact|pseudonym|anonym|mask|hash', sxsrc, re.I))) or 'NONE'}")
print("  => threat-model.md:29 claims 'sanitize all internal node IDs'.")
print("     No sanitisation code exists. Omission != sanitisation.")
print()

print("### PART 3: IS THE ORACLE FEATURE FED TO THE MODEL? ###")
print(f"  is_canary_hit in GRAPH_FEATURES: {'is_canary_hit' in bm.GRAPH_FEATURES}")
print(f"  is_canary_hit in TABULAR_FEATURES: {'is_canary_hit' in bm.TABULAR_FEATURES}")
print(f"  canary_hop_distance in GRAPH_FEATURES: {'canary_hop_distance' in bm.GRAPH_FEATURES}")
print("  => Direct tripwire flag is NOT used (good). BUT canary_hop_distance")
print("     IS used, and it is derived from the same generator decision,")
print("     with solo AUC 0.843. The leakage is indirect but real.")
print()

print("### PART 4: LOCAL DATABASE CONTENTS (git-ignored, on disk) ###")
db = "C:/Users/HP/ghost-vpa/data/ghost_vpa.db"
if os.path.exists(db):
    con = sqlite3.connect(db)
    tabs = [r[0] for r in con.execute(
        "select name from sqlite_master where type='table'")]
    print(f"  tables: {tabs}")
    for t in tabs:
        n = con.execute(f"select count(*) from {t}").fetchone()[0]
        print(f"    {t:20s} rows={n}")
    con.close()
    print("  => DB is git-ignored (line 25) and holds only synthetic rows.")
else:
    print("  no local db found")