"""Inspect the ambiguous slice of the canonical run: planted vs coordinator vs
naive, per order, plus the misses and the discriminator wins (orders where the
naive largest-signal heuristic was wrong but the coordinator reasoned correctly).
Reads the committed cache; regenerates the batch deterministically for labels and
signals. No API calls, no credits."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from otif.generator import generate_batch
from otif.engine import compute_signals, naive_attribution

CACHE = os.path.join("data", "canonical_run.json")

KEY = {
    "demand": "forecast_error_pct",
    "supplier": "supplier_late_days",
    "warehouse": "dispatch_delay_days",
    "logistics": "transit_overage_days",
}


def _sig(signals, driver):
    return getattr(signals, KEY[driver], None)


def main():
    with open(CACHE, "r", encoding="utf-8") as f:
        attributions = json.load(f)["attributions"]

    batch = generate_batch()
    rows = []
    for lo in batch:
        if not lo.planted_is_ambiguous:
            continue
        oid = lo.order.order_id
        signals = compute_signals(lo.order)
        pred = attributions[oid]
        naive = naive_attribution(lo.order, signals)
        a, b = lo.fired
        rows.append({
            "oid": oid, "fired": lo.fired, "planted": lo.planted_driver,
            "coord": pred, "naive": naive,
            "coord_ok": pred == lo.planted_driver,
            "naive_ok": naive == lo.planted_driver,
            "sig_a": (a, _sig(signals, a)), "sig_b": (b, _sig(signals, b)),
        })

    n = len(rows)
    coord_ok = sum(r["coord_ok"] for r in rows)
    naive_ok = sum(r["naive_ok"] for r in rows)
    print(f"AMBIGUOUS ORDERS: {n}")
    print(f"coordinator correct: {coord_ok}/{n} ({coord_ok/n*100:.1f}%)")
    print(f"naive correct:       {naive_ok}/{n} ({naive_ok/n*100:.1f}%)")
    print()

    print("ALL AMBIGUOUS (planted | coordinator | naive):")
    for r in rows:
        mark = "OK  " if r["coord_ok"] else "MISS"
        print(f"  [{mark}] {r['oid']}  fired {r['fired'][0]}+{r['fired'][1]:9s} "
              f"planted={r['planted']:9s} coord={r['coord']:9s} naive={r['naive']:9s}"
              f"  ({r['sig_a'][0]}={r['sig_a'][1]}, {r['sig_b'][0]}={r['sig_b'][1]})")

    print()
    print("MISSES (coordinator wrong) -- the genuinely hard cases:")
    misses = [r for r in rows if not r["coord_ok"]]
    if not misses:
        print("  none")
    for r in misses:
        print(f"  {r['oid']}: fired {r['fired']}, planted {r['planted']}, "
              f"coordinator said {r['coord']}  "
              f"[{r['sig_a'][0]}={r['sig_a'][1]}, {r['sig_b'][0]}={r['sig_b'][1]}]")

    print()
    print("DISCRIMINATOR WINS (naive wrong, coordinator right) -- the demo cases:")
    wins = [r for r in rows if r["coord_ok"] and not r["naive_ok"]]
    print(f"  {len(wins)} of {n} ambiguous orders: naive picked the wrong driver, coordinator reasoned correctly")
    for r in wins[:8]:
        print(f"  {r['oid']}: fired {r['fired']}, planted={r['planted']}, "
              f"naive wrongly said {r['naive']}  "
              f"[{r['sig_a'][0]}={r['sig_a'][1]}, {r['sig_b'][0]}={r['sig_b'][1]}]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
