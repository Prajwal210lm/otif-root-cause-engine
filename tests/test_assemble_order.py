"""assemble_claims must order an order's claims by DRIVERS order, not by the order
the specialist reports happened to arrive in. In the graph the four specialist
nodes finish in thread-completion order, so without this the coordinator's input
(and thus a canonical run) would be nondeterministic."""
from otif.orchestrate import assemble_claims


class _Claim:
    def __init__(self, oid, domain):
        self.order_id = oid
        self.domain = domain
        self.stance = "binding"
        self.confidence = "medium"
        self.reasoning = "r"
        self.cited_signals = {}


class _Report:
    def __init__(self, domain, claims):
        self.domain = domain
        self.pattern = "p"
        self.claims = tuple(claims)


class _Part:
    def __init__(self, by_specialist):
        self.by_specialist = by_specialist


def test_assemble_claims_order_is_drivers_order_not_dict_order():
    av = {"order": {"order_id": "X"}, "signals": {"shortfall_units": 5}}
    part = _Part({"demand": [av], "supplier": [av], "warehouse": [], "logistics": []})
    reports = {}
    reports["supplier"] = _Report("supplier", [_Claim("X", "supplier")])
    reports["demand"] = _Report("demand", [_Claim("X", "demand")])
    blocks = assemble_claims(reports, part)
    claim_domains = [c["domain"] for c in blocks[0]["claims"]]
    assert claim_domains == ["demand", "supplier"]  # DRIVERS order, not insertion order
