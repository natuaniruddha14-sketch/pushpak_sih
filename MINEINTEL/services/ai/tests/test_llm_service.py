import asyncio
import pytest
from app.llm import (
    LLMProvider,
    LLMProviderFactory,
    MockLLMProvider,
    OpenAILLMProvider,
    StructuredLLMResponse,
    mask_sensitive_data,
)


class TestLLMProviderService:
    def test_provider_selection_from_env(self, monkeypatch):
        monkeypatch.setenv("LLM_PROVIDER", "mock")
        provider_instance = LLMProviderFactory.get_provider()
        assert isinstance(provider_instance, MockLLMProvider)

        monkeypatch.setenv("LLM_PROVIDER", "openai")
        provider_openai = LLMProviderFactory.get_provider()
        assert isinstance(provider_openai, OpenAILLMProvider)

    def test_mask_sensitive_data(self):
        secret = "Bearer sk-proj-1234567890abcdefghijklmnopqrstuvwxyz"
        masked = mask_sensitive_data(secret)

        assert "sk-proj-1234567890" not in masked
        assert "***MASKED" in masked

    def test_llm_provider_generate(self):
        async def _test():
            llm = LLMProvider(provider=MockLLMProvider())
            prompt = (
                "USER QUESTION: What is the proved coal reserve in Gevra?\n\n"
                "DOCUMENT EVIDENCE CONTEXT:\n"
                "- [Doc: Gevra_Report.pdf | Page: 14]\n"
                "  Snippet: \"Proved coal reserve in Seam V/VI/VII is 425.80 MT.\""
            )
            resp = await llm.generate(prompt)

            assert isinstance(resp, str)
            assert "425.80" in resp or "coal" in resp or "proved" in resp.lower()

        asyncio.run(_test())

    def test_llm_provider_generate_structured(self):
        async def _test():
            llm = LLMProvider(provider=MockLLMProvider())
            prompt = (
                "USER QUESTION: What is the proved reserve in Gevra?\n\n"
                "DOCUMENT EVIDENCE CONTEXT:\n"
                "- [Doc: Gevra_Report.pdf | Page: 14]\n"
                "  Snippet: \"Proved coal reserve in Seam V/VI/VII is 425.80 MT.\""
            )
            structured_resp = await llm.generateStructured(prompt)

            assert isinstance(structured_resp, StructuredLLMResponse)
            assert hasattr(structured_resp, "answer")
            assert hasattr(structured_resp, "confidence")
            assert hasattr(structured_resp, "citations")
            assert hasattr(structured_resp, "calculations")
            assert hasattr(structured_resp, "warnings")
            assert structured_resp.confidence >= 0.0

        asyncio.run(_test())

    def test_llm_provider_insufficient_evidence_grounding(self):
        async def _test():
            llm = LLMProvider(provider=MockLLMProvider())
            prompt = "INSUFFICIENT_EVIDENCE_FLAG: No relevant document evidence found for query."
            
            resp = await llm.generate(prompt)
            assert resp == "Insufficient evidence found in the indexed documents."

            structured_resp = await llm.generateStructured(prompt)
            assert structured_resp.answer == "Insufficient evidence found in the indexed documents."
            assert structured_resp.confidence == 0.0
            assert len(structured_resp.citations) == 0

        asyncio.run(_test())
