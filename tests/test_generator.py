import random

from otif.constants import DRIVERS
from otif.types import Order
from otif.engine import compute_signals, _fired_domains
from otif.generator import generate_batch, agent_view, DEFAULT_SEED, DEFAULT_N

AMBIGUOUS_FLOOR = 0.18
ADJACENT_PAIRS = {
    frozenset({"demand", "supplier"}),
    frozenset({"supplier", "warehouse"}),
    frozenset({"warehouse", "logistics"}),
}


def _batch():
    return generate_batch(seed=DEFAULT_SEED, n=DEFAULT_N)


def test_batch_size():
    assert len(_batch()) == DEFAULT_N


def test_every_order_fires_one_or_two_adjacent_signals():
    for lo in _batch():
        sig = compute_signals(lo.order)
        fired = set(_fired_domains(sig))
        assert len(fired) in (1, 2), f"{lo.order.order_id} fired {fired}"
        if len(fired) == 2:
            assert frozenset(fired) in ADJACENT_PAIRS, f"{lo.order.order_id} non-adjacent {fired}"


def test_every_order_genuinely_fails_otif():
    for lo in _batch():
        o = lo.order
        in_full = o.delivered_qty >= o.order_qty
        on_time = o.delivered_date <= o.promised_date
        assert not (in_full and on_time), f"{o.order_id} did not fail OTIF"


def test_ambiguous_share_clears_floor():
    batch = _batch()
    amb = sum(1 for lo in batch if lo.planted_is_ambiguous)
    share = amb / len(batch)
    assert share >= AMBIGUOUS_FLOOR, f"ambiguous share {share:.3f} below floor {AMBIGUOUS_FLOOR}"


def test_planted_ambiguity_matches_fired_count():
    for lo in _batch():
        fired = _fired_domains(compute_signals(lo.order))
        assert lo.planted_is_ambiguous == (len(fired) == 2), f"{lo.order.order_id} ambiguity mismatch"


def test_every_order_has_valid_label():
    for lo in _batch():
        assert lo.planted_driver in DRIVERS, f"{lo.order.order_id} bad label {lo.planted_driver}"


def test_batch_is_deterministic():
    a = generate_batch(seed=DEFAULT_SEED, n=DEFAULT_N)
    b = generate_batch(seed=DEFAULT_SEED, n=DEFAULT_N)
    assert a == b


def test_agent_view_strips_ground_truth():
    for lo in _batch():
        view = agent_view(lo)
        assert set(view.keys()) == {"order", "signals"}
        assert "planted_driver" not in view
        assert "planted_is_ambiguous" not in view
        flat = str(view)
        assert "planted" not in flat
