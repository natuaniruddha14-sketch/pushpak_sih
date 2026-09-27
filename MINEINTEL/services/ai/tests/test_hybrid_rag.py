import asyncio
import pytest
from app.rag import (
    DocumentIndexer,
    DocumentPageInput,
    QuestionClassifier,
    VectorRetriever,
    KeywordRetriever,
    StructuredRetriever,
    HybridRetriever,
    Reranker,
    ContextBuilder,
    CitationBuilder,
    AnswerGenerator,
    QueryResponse,
    IN_MEMORY_VECTOR_STORE,
)
from app.embeddings import MockEmbeddingProvider
from app.llm import MockLLMProvider


class TestHybridRAGEngine:
    def test_question_classifier(self):
        classifier = QuestionClassifier()

        res1 = classifier.classify("What is the proved coal reserve and seam thickness in Gevra OCP?")
        assert res1.query_type == "GEOLOGICAL_RESERVE"
        assert res1.extracted_mine == "Gevra"
        assert res1.requires_structured_lookup is True

        res2 = classifier.classify("Compare stripping ratio between Rajmahal and Gevra opencast projects")
        assert res2.query_type in ("NUMERICAL_METRIC", "COMPARATIVE")
        assert res2.requires_structured_lookup is True

    def test_hybrid_retrieval_and_reranking(self):
        async def _test():
            # Seed vector store with indexer
            indexer = DocumentIndexer(provider=MockEmbeddingProvider())
            pages = [
                DocumentPageInput(
                    page_id="p-gevra-01",
                    page_number=14,
                    raw_text="Proved coal reserve in Gevra OCP Seam V/VI/VII stands at 425.80 Million Tonnes (MT) with average seam thickness of 18.4 meters.",
                    document_id="doc-gevra-2026",
                    project_id="prj-gevra-001",
                    document_type="PDF"
                )
            ]
            await indexer.index_document_pages(document_id="doc-gevra-2026", pages=pages)

            classifier = QuestionClassifier()
            class_res = classifier.classify("What is the proved coal reserve in Gevra OCP?")

            hybrid = HybridRetriever(
                vector_retriever=VectorRetriever(embedding_provider=MockEmbeddingProvider()),
                keyword_retriever=KeywordRetriever(),
                structured_retriever=StructuredRetriever()
            )

            candidates = await hybrid.retrieve_candidates("What is the proved coal reserve in Gevra OCP?", class_res)
            assert len(candidates) > 0

            reranker = Reranker()
            top_evidence = reranker.rerank(candidates, "What is the proved coal reserve in Gevra OCP?", class_res, top_k=3)

            assert len(top_evidence) > 0
            assert top_evidence[0].document_id in ("doc-gevra-2026", "doc-gevra-2026")
            assert top_evidence[0].relevance_score >= 0.35

        asyncio.run(_test())

    def test_answer_generator_pipeline(self):
        async def _test():
            indexer = DocumentIndexer(provider=MockEmbeddingProvider())
            pages = [
                DocumentPageInput(
                    page_id="p-gevra-01",
                    page_number=14,
                    raw_text="Proved coal reserve in Gevra OCP Seam V/VI/VII stands at 425.80 Million Tonnes (MT) with average seam thickness of 18.4 meters.",
                    document_id="doc-gevra-2026",
                    project_id="prj-gevra-001",
                    document_type="PDF"
                )
            ]
            await indexer.index_document_pages(document_id="doc-gevra-2026", pages=pages)

            engine = AnswerGenerator(
                llm_provider=MockLLMProvider(),
                embedding_provider=MockEmbeddingProvider(),
                min_relevance_threshold=0.30
            )

            res = await engine.execute_rag_pipeline("What is the proved coal reserve in Gevra OCP?")

            assert isinstance(res, QueryResponse)
            assert "425.80" in res.answer or "Gevra" in res.answer or "proved" in res.answer.lower()
            assert res.confidence > 0.0
            assert len(res.citations) > 0
            assert len(res.retrievedSources) > 0
            assert res.queryType in ("GEOLOGICAL_RESERVE", "NUMERICAL_METRIC")

            # Check citation properties
            cit = res.citations[0]
            assert cit.document_id is not None
            assert cit.document_name is not None
            assert cit.page_number > 0
            assert cit.snippet is not None
            assert cit.relevance_score > 0.0

        asyncio.run(_test())

    def test_insufficient_evidence_grounding_safeguard(self):
        async def _test():
            # Clear vector store
            IN_MEMORY_VECTOR_STORE.clear()

            engine = AnswerGenerator(
                llm_provider=MockLLMProvider(),
                embedding_provider=MockEmbeddingProvider(),
                min_relevance_threshold=0.50
            )

            # Query completely unrelated domain without matching evidence
            res = await engine.execute_rag_pipeline("What is the quantum mechanics equation for semiconductor bandgaps?")

            assert res.answer == "Insufficient evidence found in the indexed documents."
            assert res.confidence == 0.0
            assert len(res.citations) == 0
            assert len(res.retrievedSources) == 0

        asyncio.run(_test())
