import os
import asyncio
import pytest
from app.embeddings import (
    EmbeddingProviderFactory,
    MockEmbeddingProvider,
    OpenAIEmbeddingProvider,
    EmbeddingProviderError,
)


class TestEmbeddingProviders:
    def test_mock_embedding_provider(self):
        async def _test():
            provider = MockEmbeddingProvider(dimensions=1536)
            vec = await provider.embed_text("Mining geological reserve test sentence")

            assert len(vec) == 1536
            assert isinstance(vec[0], float)

            batch_vecs = await provider.embed_batch([
                "Seam V/VI/VII reserve MT",
                "Borewell log thickness"
            ])
            assert len(batch_vecs) == 2
            assert len(batch_vecs[0]) == 1536

        asyncio.run(_test())

    def test_provider_factory(self, monkeypatch):
        async def _test():
            monkeypatch.setenv("EMBEDDING_PROVIDER", "mock")
            provider = EmbeddingProviderFactory.get_provider()
            assert isinstance(provider, MockEmbeddingProvider)

            monkeypatch.setenv("EMBEDDING_PROVIDER", "openai")
            provider_openai = EmbeddingProviderFactory.get_provider()
            assert isinstance(provider_openai, OpenAIEmbeddingProvider)

        asyncio.run(_test())

    def test_openai_fallback_without_api_key(self):
        async def _test():
            # OpenAI provider without API key gracefully falls back to mock vectors
            provider = OpenAIEmbeddingProvider(api_key="")
            vec = await provider.embed_text("Fallback test")
            assert len(vec) == 1536
            assert isinstance(vec[0], float)

        asyncio.run(_test())
