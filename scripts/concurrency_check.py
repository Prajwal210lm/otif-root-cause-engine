import time, json
from otif.constants import DRIVERS
from otif.generator import generate_batch
from otif.pipeline import prep_partition
from otif.graph import run_graph

class SlowMock:
    def __init__(self, a):
        self.a = a
        self.by = {d: sorted(o for o, f in a.items() if d in f) for d in DRIVERS}
        self.ids = sorted(a)
    def __call__(self, system, user):
        if "You are the coordinator" in system:
            return json.dumps({"attributions": {o: self.a[o][0] for o in self.ids},
                               "narrative": "Impact {{total_cash}} over {{total_orders}}; top {{rank1_driver}} {{rank1_cash}}."})
        time.sleep(0.4)  # simulate a specialist API call
        d = [x for x in DRIVERS if f"the {x} specialist" in system][0]
        return json.dumps({"domain": d, "pattern": "p",
                           "claims": [{"order_id": o, "stance": "binding", "confidence": "medium",
                                       "reasoning": "m", "cited_signals": {}} for o in self.by[d]]})

b = generate_batch()
t0 = time.time()
res = run_graph(b, SlowMock(prep_partition(b).assignments))
dt = time.time() - t0
print(f"wall time: {dt:.2f}s  (4 specialists x 0.4s)")
print("=> CONCURRENT" if dt < 1.0 else "=> SEQUENTIAL")
print("render ok:", res.render.ok, "| violations:", res.attribution_violations)
