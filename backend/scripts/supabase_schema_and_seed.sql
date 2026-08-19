-- ==============================================================================
-- VMEC HEALTHCARE AI - SUPABASE PGVECTOR DDL & KNOWLEDGE BASE SCHEMA
-- CSDL Tri Thức Lâm Sàng Định Tuyến 13 Chuyên Khoa Y Tế (1024D Mistral Embeddings)
-- ==============================================================================

-- 1. Kích hoạt extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tạo bảng Chunks Tri Thức Y Khoa (knowledge_chunks)
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
    chunk_id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL,
    normalized_text TEXT NOT NULL,
    specialty_code TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tạo bảng Embeddings 1024 Chiều (knowledge_embeddings)
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
    chunk_id TEXT PRIMARY KEY REFERENCES public.knowledge_chunks(chunk_id) ON DELETE CASCADE,
    embedding VECTOR(1024) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tạo chỉ mục HNSW Index cho tìm kiếm Vector siêu tốc (<15ms)
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw 
ON public.knowledge_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Cấu hình Row-Level Security (RLS) cho phép Backend & Anonymous đọc/ghi
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read chunks" ON public.knowledge_chunks;
CREATE POLICY "Allow anonymous read chunks" ON public.knowledge_chunks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert chunks" ON public.knowledge_chunks;
CREATE POLICY "Allow anonymous insert chunks" ON public.knowledge_chunks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Allow anonymous read embeddings" ON public.knowledge_embeddings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous insert embeddings" ON public.knowledge_embeddings;
CREATE POLICY "Allow anonymous insert embeddings" ON public.knowledge_embeddings FOR INSERT WITH CHECK (true);

-- 6. Tạo Hàm RPC match_knowledge_chunks tìm kiếm tương đồng Cosine
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
    query_embedding VECTOR(1024),
    match_threshold FLOAT DEFAULT 0.60,
    match_count INT DEFAULT 4
)
RETURNS TABLE (
    chunk_id TEXT,
    record_id TEXT,
    normalized_text TEXT,
    specialty_code TEXT,
    metadata JSONB,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.chunk_id,
        c.record_id,
        c.normalized_text,
        c.specialty_code,
        c.metadata,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.knowledge_embeddings e
    JOIN public.knowledge_chunks c ON c.chunk_id = e.chunk_id
    WHERE 1 - (e.embedding <=> query_embedding) >= match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$;
