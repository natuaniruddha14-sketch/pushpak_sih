-- Initialize pgvector extension for MINEINTEL AI vector database
CREATE EXTENSION IF NOT EXISTS vector;

-- Performance & Hybrid Search Indexes:
-- 1. HNSW Index on DocumentChunk vector embeddings using Cosine Distance
-- Note: Created conditionally if DocumentChunk table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'DocumentChunk'
    ) THEN
        -- Create HNSW Vector Index for fast semantic nearest-neighbor retrieval
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' AND tablename = 'DocumentChunk' AND indexname = 'idx_document_chunk_embedding_hnsw'
        ) THEN
            CREATE INDEX idx_document_chunk_embedding_hnsw 
            ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops)
            WITH (m = 16, ef_construction = 64);
        END IF;

        -- Create GIN Index for rapid full-text keyword retrieval in hybrid search
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE schemaname = 'public' AND tablename = 'DocumentChunk' AND indexname = 'idx_document_chunk_content_fts'
        ) THEN
            CREATE INDEX idx_document_chunk_content_fts 
            ON "DocumentChunk" USING gin (to_tsvector('english', "content"));
        END IF;
    END IF;
END $$;
