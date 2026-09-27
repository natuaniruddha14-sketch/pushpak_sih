import os
import time
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import List, Optional
import httpx

logger = logging.getLogger("mineintel.embeddings")


class EmbeddingProviderError(Exception):
    """Custom exception raised when vector embedding generation fails after retries."""
    pass


class EmbeddingProviderBase(ABC):
    """Abstract Base Class for Text Embedding Providers."""

    def __init__(self, model_name: str = "text-embedding-3-small", dimensions: int = 1536):
        self.model_name = model_name
        self.dimensions = dimensions

    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """Generate vector embedding for a single text string."""
        pass

    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for a list of text chunks in batch."""
        pass


class MockEmbeddingProvider(EmbeddingProviderBase):
    """
    Deterministic Mock Embedding Provider for testing, offline execution, and local dev.
    Generates unit-normalized 1536-dimensional vectors based on text hash.
    """

    async def embed_text(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.dimensions
        seed = sum(ord(c) for c in text[:50]) % 1000
        raw_vec = [((i + seed) % 19) / 19.0 - 0.5 for i in range(self.dimensions)]
        # Normalize vector to unit length
        magnitude = (sum(x * x for x in raw_vec)) ** 0.5 or 1.0
        return [round(x / magnitude, 6) for x in raw_vec]

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [await self.embed_text(t) for t in texts]


class OpenAIEmbeddingProvider(EmbeddingProviderBase):
    """
    OpenAI Embedding Provider using HTTP API with exponential backoff retries.
    Configurable via EMBEDDING_MODEL and EMBEDDING_API_KEY / OPENAI_API_KEY.
    """

    def __init__(
        self,
        model_name: str = "text-embedding-3-small",
        api_key: Optional[str] = None,
        dimensions: int = 1536,
        max_retries: int = 3,
    ):
        super().__init__(model_name=model_name, dimensions=dimensions)
        self.api_key = api_key or os.getenv("EMBEDDING_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
        self.api_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1") + "/embeddings"
        self.max_retries = max_retries

    async def _request_with_retry(self, input_payload: List[str]) -> List[List[float]]:
        if not self.api_key:
            logger.warning("No OpenAI API key supplied, falling back to mock vectors.")
            mock_p = MockEmbeddingProvider(model_name=self.model_name, dimensions=self.dimensions)
            return await mock_p.embed_batch(input_payload)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        body = {
            "model": self.model_name,
            "input": input_payload,
        }

        delay = 1.0
        last_exception = None

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(self.api_url, headers=headers, json=body)
                    if resp.status_code == 200:
                        data = resp.json()
                        embeddings = [item["embedding"] for item in data.get("data", [])]
                        return embeddings
                    elif resp.status_code in (429, 500, 502, 503, 504):
                        logger.warning(f"[OpenAI Embedding Attempt {attempt}/{self.max_retries}] Status {resp.status_code}: {resp.text}")
                    else:
                        raise EmbeddingProviderError(f"OpenAI API returned status {resp.status_code}: {resp.text}")
            except Exception as e:
                logger.error(f"[OpenAI Embedding Attempt {attempt}/{self.max_retries}] Error: {str(e)}")
                last_exception = e

            if attempt < self.max_retries:
                await asyncio.sleep(delay)
                delay *= 2.0

        raise EmbeddingProviderError(f"Failed to generate OpenAI embeddings after {self.max_retries} attempts: {str(last_exception)}")

    async def embed_text(self, text: str) -> List[float]:
        res = await self._request_with_retry([text])
        return res[0]

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        return await self._request_with_retry(texts)


class HuggingFaceEmbeddingProvider(EmbeddingProviderBase):
    """
    HuggingFace Inference / Feature Extraction Provider with retry logic.
    """

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        api_key: Optional[str] = None,
        dimensions: int = 384,
        max_retries: int = 3,
    ):
        super().__init__(model_name=model_name, dimensions=dimensions)
        self.api_key = api_key or os.getenv("HUGGINGFACE_API_KEY") or ""
        self.api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{self.model_name}"
        self.max_retries = max_retries

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        if not self.api_key:
            mock_p = MockEmbeddingProvider(model_name=self.model_name, dimensions=self.dimensions)
            return await mock_p.embed_batch(texts)

        headers = {"Authorization": f"Bearer {self.api_key}"}
        delay = 1.0

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(self.api_url, headers=headers, json={"inputs": texts, "options": {"wait_for_model": True}})
                    if resp.status_code == 200:
                        return resp.json()
            except Exception as e:
                logger.error(f"[HuggingFace Attempt {attempt}/{self.max_retries}] Error: {str(e)}")
            if attempt < self.max_retries:
                await asyncio.sleep(delay)
                delay *= 2.0

        raise EmbeddingProviderError(f"HuggingFace embedding failed after {self.max_retries} attempts")

    async def embed_text(self, text: str) -> List[float]:
        res = await self.embed_batch([text])
        return res[0]


class OllamaEmbeddingProvider(EmbeddingProviderBase):
    """
    Ollama Local Embedding Provider (e.g. nomic-embed-text).
    """

    def __init__(
        self,
        model_name: str = "nomic-embed-text",
        base_url: Optional[str] = None,
        dimensions: int = 768,
        max_retries: int = 3,
    ):
        super().__init__(model_name=model_name, dimensions=dimensions)
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.max_retries = max_retries

    async def embed_text(self, text: str) -> List[float]:
        url = f"{self.base_url}/api/embeddings"
        payload = {"model": self.model_name, "prompt": text}
        delay = 1.0

        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        return resp.json().get("embedding", [0.0] * self.dimensions)
            except Exception as e:
                logger.error(f"[Ollama Attempt {attempt}/{self.max_retries}] Error: {str(e)}")

            if attempt < self.max_retries:
                await asyncio.sleep(delay)
                delay *= 2.0

        mock_p = MockEmbeddingProvider(model_name=self.model_name, dimensions=self.dimensions)
        return await mock_p.embed_text(text)

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [await self.embed_text(t) for t in texts]


class EmbeddingProviderFactory:
    """
    Factory class to instantiate embedding provider dynamically based on environment variables.
    Reads EMBEDDING_PROVIDER and EMBEDDING_MODEL from env or fallback settings.
    """

    @staticmethod
    def get_provider(
        provider_name: Optional[str] = None,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> EmbeddingProviderBase:
        prov = (provider_name or os.getenv("EMBEDDING_PROVIDER") or "mock").strip().lower()
        model = model_name or os.getenv("EMBEDDING_MODEL") or "text-embedding-3-small"

        if prov == "openai":
            return OpenAIEmbeddingProvider(model_name=model, api_key=api_key)
        elif prov in ("huggingface", "hf"):
            return HuggingFaceEmbeddingProvider(model_name=model, api_key=api_key)
        elif prov == "ollama":
            return OllamaEmbeddingProvider(model_name=model)
        else:
            return MockEmbeddingProvider(model_name=model)
