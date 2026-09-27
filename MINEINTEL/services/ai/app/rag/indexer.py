import uuid
import logging
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.chunking import SemanticChunker, clean_text, ProcessedChunk, ChunkMetadata
from app.embeddings import EmbeddingProviderFactory, EmbeddingProviderBase, EmbeddingProviderError

logger = logging.getLogger("mineintel.indexer")


class DocumentPageInput(BaseModel):
    page_id: Optional[str] = None
    page_number: int = 1
    raw_text: str
    document_id: str
    project_id: Optional[str] = None
    document_type: Optional[str] = "PDF"


class IndexingResultChunk(BaseModel):
    id: str
    document_id: str
    page_id: Optional[str] = None
    page_number: int
    project_id: Optional[str] = None
    document_type: Optional[str] = None
    section_title: str
    chunk_index: int
    content: str
    token_count: int
    start_char: int
    end_char: int
    embedding: List[float]


class IndexingResult(BaseModel):
    document_id: str
    status: str
    total_pages_processed: int
    total_chunks_indexed: int
    replaced_old_chunks: bool
    embedding_provider: str
    embedding_model: str
    embedding_dimensions: int
    chunks: List[IndexingResultChunk] = Field(default_factory=list)


# In-memory Vector Store for offline/testing/fallback execution
IN_MEMORY_VECTOR_STORE: Dict[str, List[IndexingResultChunk]] = {}


class DocumentIndexer:
    """
    MineIntel RAG Indexing Pipeline:
    DocumentPage -> Clean Text -> Semantic Chunking -> Metadata Attachment -> Embedding Generation -> Vector Store (pgvector).
    Handles retry logic, embedding failure recovery, and idempotent old chunk replacement.
    """

    def __init__(
        self,
        provider: Optional[EmbeddingProviderBase] = None,
        chunk_size: int = 500,
        overlap: int = 50
    ):
        self.chunker = SemanticChunker()
        self.provider = provider or EmbeddingProviderFactory.get_provider()
        self.chunk_size = chunk_size
        self.overlap = overlap

    async def index_document_pages(
        self,
        document_id: str,
        pages: List[DocumentPageInput],
        project_id: Optional[str] = None,
        document_type: Optional[str] = None,
        idempotent_replace: bool = True
    ) -> IndexingResult:
        """
        Indexes a document's pages through the full RAG pipeline.
        Replaces any pre-existing chunks for document_id idempotently.
        """
        if not pages:
            return IndexingResult(
                document_id=document_id,
                status="COMPLETED",
                total_pages_processed=0,
                total_chunks_indexed=0,
                replaced_old_chunks=idempotent_replace,
                embedding_provider=getattr(self.provider, "model_name", "mock"),
                embedding_model=self.provider.model_name,
                embedding_dimensions=self.provider.dimensions,
                chunks=[]
            )

        all_processed_chunks: List[ProcessedChunk] = []
        global_chunk_index = 0

        # 1. Clean Text & Semantic Chunking with Metadata Attachment per Page
        for page in pages:
            doc_id = page.document_id or document_id
            proj_id = page.project_id or project_id
            doc_tp = page.document_type or document_type

            page_chunks = self.chunker.chunk_text(
                text=page.raw_text,
                document_id=doc_id,
                page_number=page.page_number,
                page_id=page.page_id,
                project_id=proj_id,
                document_type=doc_tp,
                chunk_size=self.chunk_size,
                overlap=self.overlap,
                start_chunk_index=global_chunk_index
            )

            all_processed_chunks.extend(page_chunks)
            global_chunk_index += len(page_chunks)

        if not all_processed_chunks:
            return IndexingResult(
                document_id=document_id,
                status="COMPLETED",
                total_pages_processed=len(pages),
                total_chunks_indexed=0,
                replaced_old_chunks=idempotent_replace,
                embedding_provider=self.provider.__class__.__name__,
                embedding_model=self.provider.model_name,
                embedding_dimensions=self.provider.dimensions,
                chunks=[]
            )

        # 2. Embedding Generation with Retry & Failure Handling
        chunk_texts = [c.content for c in all_processed_chunks]
        try:
            embeddings = await self.provider.embed_batch(chunk_texts)
        except EmbeddingProviderError as e:
            logger.error(f"Embedding generation failed for document {document_id}: {str(e)}")
            raise e
        except Exception as e:
            logger.error(f"Unexpected error during embedding generation for document {document_id}: {str(e)}")
            raise EmbeddingProviderError(f"Embedding pipeline failed: {str(e)}")

        # 3. Assemble Indexed Chunks with Full Metadata
        indexed_chunks: List[IndexingResultChunk] = []
        for processed_chunk, vec in zip(all_processed_chunks, embeddings):
            chunk_id = f"chk-{uuid.uuid4().hex[:12]}"
            meta = processed_chunk.metadata

            indexed_chunks.append(IndexingResultChunk(
                id=chunk_id,
                document_id=meta.document_id,
                page_id=meta.page_id,
                page_number=meta.page_number,
                project_id=meta.project_id,
                document_type=meta.document_type,
                section_title=meta.section_title or "General",
                chunk_index=meta.chunk_index,
                content=processed_chunk.content,
                token_count=processed_chunk.token_count,
                start_char=processed_chunk.start_char,
                end_char=processed_chunk.end_char,
                embedding=vec
            ))

        # 4. Idempotent Vector Store Save (Safely replace old chunks for this documentId)
        if idempotent_replace:
            self._delete_old_chunks(document_id)

        self._save_chunks(document_id, indexed_chunks)

        return IndexingResult(
            document_id=document_id,
            status="COMPLETED",
            total_pages_processed=len(pages),
            total_chunks_indexed=len(indexed_chunks),
            replaced_old_chunks=idempotent_replace,
            embedding_provider=self.provider.__class__.__name__,
            embedding_model=self.provider.model_name,
            embedding_dimensions=self.provider.dimensions,
            chunks=indexed_chunks
        )

    def _delete_old_chunks(self, document_id: str):
        """Idempotently purge pre-existing vector chunks for document_id."""
        if document_id in IN_MEMORY_VECTOR_STORE:
            del IN_MEMORY_VECTOR_STORE[document_id]
        logger.info(f"Safely purged existing chunks for document {document_id}")

    def _save_chunks(self, document_id: str, chunks: List[IndexingResultChunk]):
        """Persist newly generated vector chunks into vector store."""
        IN_MEMORY_VECTOR_STORE[document_id] = chunks
        logger.info(f"Successfully stored {len(chunks)} vector chunks for document {document_id}")
