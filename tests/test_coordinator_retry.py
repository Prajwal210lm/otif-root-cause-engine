"""Hardening the coordinator's output: the bare-digit helper, the strengthened
no-digit constraint, and the bounded retry that re-prompts when the narrative leaks
a digit. The retry is deterministic and credit-free (driven by a scripted mock)."""
import json

from otif.validate import has_bare_digit
from otif.coordinator import build_coordinator_prompt, CoordinatorOutput
from otif.orchestrate import run_coordinator


def test_has_bare_digit_true_on_bare_number():
    assert has_bare_digit("Supplier drove AED 500 of impact.")


def test_has_bare_digit_false_on_placeholders_and_words():
    assert not has_bare_digit("Top {{rank1_driver}} at {{rank1_cash}}; three suppliers late.")


def test_coordinator_system_forbids_any_digit():
    sysp = build_coordinator_prompt([], {})["system"].lower()
    assert "no digit 0-9" in sysp or "any digit 0-9" in sysp
    assert "spell" in sysp


class _ScriptedLLM:
    """Returns coordinator JSON from a queue of narratives, one per call."""

    def __init__(self, narratives, order_ids):
        self.narratives = list(narratives)
        self.order_ids = list(order_ids)
        self.calls = 0

    def __call__(self, system, user):
        self.calls += 1
        narrative = self.narratives[min(self.calls - 1, len(self.narratives) - 1)]
        attributions = {oid: "supplier" for oid in self.order_ids}
        return json.dumps({"attributions": attributions, "narrative": narrative})


_IDS = ["OTIF-0000", "OTIF-0001"]
_CLEAN = "Top driver {{rank1_driver}} at {{rank1_cash}}."
_DIRTY = "Top driver was responsible for 3 of the failures."


def test_retry_returns_clean_after_one_bad_attempt():
    llm = _ScriptedLLM([_DIRTY, _CLEAN], _IDS)
    out = run_coordinator([], {}, set(_IDS), llm, max_retries=2)
    assert isinstance(out, CoordinatorOutput)
    assert not has_bare_digit(out.narrative)
    assert llm.calls == 2


def test_no_retry_when_first_is_clean():
    llm = _ScriptedLLM([_CLEAN], _IDS)
    out = run_coordinator([], {}, set(_IDS), llm, max_retries=2)
    assert llm.calls == 1


def test_retry_gives_up_after_max_and_returns_last():
    llm = _ScriptedLLM([_DIRTY], _IDS)
    out = run_coordinator([], {}, set(_IDS), llm, max_retries=2)
    assert llm.calls == 3
    assert has_bare_digit(out.narrative)
