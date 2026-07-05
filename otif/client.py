"""Thin Anthropic client behind the same (system, user) -> str callable that the
mock satisfies, so it drops into run_graph/run_pipeline with no structural change.
The API key is read from the ANTHROPIC_API_KEY environment variable by the SDK and
never appears in code. The underlying client can be injected for testing without a
key."""
import os

MODEL_SONNET = "claude-sonnet-4-6"
MODEL_OPUS = "claude-opus-4-8"


class AnthropicClient:
    def __init__(self, model=MODEL_SONNET, max_tokens=16384, temperature=0.0, client=None):
        if client is not None:
            self._client = client
        else:
            from anthropic import Anthropic
            # reads ANTHROPIC_API_KEY from the environment; bounded so a hung
            # call cannot hold a worker thread indefinitely. 300s because the
            # coordinator prompt for a full 140-order batch is large and a
            # 120s ceiling proved genuinely too short, not a one-off fluke.
            self._client = Anthropic(timeout=300.0, max_retries=2)
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature
        # running totals for this instance, so a caller holding the instance
        # (e.g. the API layer, for spend logging) can read real usage after a run
        self.total_input_tokens = 0
        self.total_output_tokens = 0

    def __call__(self, system: str, user: str) -> str:
        resp = self._client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        usage = getattr(resp, "usage", None)
        if usage is not None:
            self.total_input_tokens += getattr(usage, "input_tokens", 0) or 0
            self.total_output_tokens += getattr(usage, "output_tokens", 0) or 0
        if getattr(resp, "stop_reason", None) == "max_tokens":
            raise RuntimeError(
                f"Anthropic response truncated at max_tokens={self.max_tokens}. "
                "The model's output did not fit. Raise max_tokens and retry."
            )
        return "".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
