"""Deterministic scoring harness. The ruler that scores any attributor against
the held-out planted labels. No LLM, no fabrication: it only counts matches and
divides. Proven against hand-verified fixtures before it measures anything."""
from dataclasses import dataclass
from typing import Optional

from otif.constants import DRIVERS
from otif.engine import compute_signals, naive_attribution


@dataclass(frozen=True)
class Scorecard:
    n_total: int
    n_clean: int
    n_ambiguous: int
    overall_correct: int
    clean_correct: int
    ambiguous_correct: int

    @staticmethod
    def _acc(correct: int, n: int) -> Optional[float]:
        return (correct / n) if n else None

    @property
    def overall_accuracy(self) -> Optional[float]:
        return self._acc(self.overall_correct, self.n_total)

    @property
    def clean_accuracy(self) -> Optional[float]:
        return self._acc(self.clean_correct, self.n_clean)

    @property
    def ambiguous_accuracy(self) -> Optional[float]:
        return self._acc(self.ambiguous_correct, self.n_ambiguous)


@dataclass(frozen=True)
class Lift:
    overall: Optional[float]
    clean: Optional[float]
    ambiguous: Optional[float]


def _tally(batch, predict) -> Scorecard:
    n_total = n_clean = n_ambiguous = 0
    overall_c = clean_c = amb_c = 0
    for lo in batch:
        pred = predict(lo)
        if pred not in DRIVERS:
            raise ValueError(f"{lo.order.order_id}: prediction {pred!r} not a valid driver")
        correct = (pred == lo.planted_driver)
        n_total += 1
        overall_c += correct
        if lo.planted_is_ambiguous:
            n_ambiguous += 1
            amb_c += correct
        else:
            n_clean += 1
            clean_c += correct
    return Scorecard(
        n_total=n_total, n_clean=n_clean, n_ambiguous=n_ambiguous,
        overall_correct=overall_c, clean_correct=clean_c, ambiguous_correct=amb_c,
    )


def score_predictions(batch, predictions: dict) -> Scorecard:
    """Score a set of per-order driver predictions against planted labels.
    Requires a prediction for every order; a missing one is an error, not a
    silent zero."""
    def predict(lo):
        if lo.order.order_id not in predictions:
            raise ValueError(f"missing prediction for {lo.order.order_id}")
        return predictions[lo.order.order_id]
    return _tally(batch, predict)


def naive_scorecard(batch) -> Scorecard:
    """The official floor: the deterministic largest-signal strawman, scored."""
    def predict(lo):
        return naive_attribution(lo.order, compute_signals(lo.order))
    return _tally(batch, predict)


def compute_lift(better: Scorecard, baseline: Scorecard) -> Lift:
    """Per-slice accuracy gain of one attributor over a baseline on the same batch."""
    def delta(a: Optional[float], b: Optional[float]) -> Optional[float]:
        return None if (a is None or b is None) else (a - b)
    return Lift(
        overall=delta(better.overall_accuracy, baseline.overall_accuracy),
        clean=delta(better.clean_accuracy, baseline.clean_accuracy),
        ambiguous=delta(better.ambiguous_accuracy, baseline.ambiguous_accuracy),
    )


def score_run(batch, predictions: dict):
    """Convenience: predictions scorecard, naive floor, and the lift between them."""
    card = score_predictions(batch, predictions)
    naive = naive_scorecard(batch)
    return card, naive, compute_lift(card, naive)
