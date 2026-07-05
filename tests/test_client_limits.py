"""The canonical run truncated the largest specialist's JSON at the old 8192 cap.
These lock the raised ceiling and the guard that turns a future truncation into a
clear error instead of a downstream JSON crash."""
import pytest

from otif.client import AnthropicClient


class _Block:
    def __init__(self, text):
        self.type = "text"
        self.text = text


class _Resp:
    def __init__(self, blocks, stop_reason="end_turn"):
        self.content = blocks
        self.stop_reason = stop_reason


class _FakeMessages:
    def __init__(self, resp):
        self._resp = resp

    def create(self, **kwargs):
        return self._resp


class _FakeSDK:
    def __init__(self, resp):
        self.messages = _FakeMessages(resp)


def test_default_max_tokens_is_raised():
    client = AnthropicClient(client=_FakeSDK(_Resp([_Block("{}")])))
    assert client.max_tokens >= 16384


def test_truncation_raises_clear_error():
    sdk = _FakeSDK(_Resp([_Block('{"partial":')], stop_reason="max_tokens"))
    client = AnthropicClient(client=sdk)
    with pytest.raises(RuntimeError, match="truncated"):
        client("sys", "usr")


def test_normal_stop_reason_returns_text():
    sdk = _FakeSDK(_Resp([_Block("ok")], stop_reason="end_turn"))
    client = AnthropicClient(client=sdk)
    assert client("s", "u") == "ok"
