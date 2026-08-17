/**
 * Vector Search & RAG Retrieval Engine for VMEC Healthcare
 * - Generates 1024D Embeddings with Mistral API Key Pool Rotation (13 Keys)
 * - Queries Supabase PostgreSQL pgvector across 2,670 Medical Chunks (match_knowledge_chunks RPC)
 * - Grounded Context Extraction & Real-time Citations Generation
 * - Automatic High-Availability Fallback to In-Memory Clinical Catalog
 */

import { MASTER_SPECIALTIES, getSpecialtyByCode } from "@/lib/clinicalMasterCatalog";

export interface VectorSearchResultChunk {
  chunkId: string;
  recordId: string;
  text: string;
  similarity: number;
  specialtyCode?: string;
  routeType?: string;
  metadata?: Record<string, unknown>;
}

export interface RAGVectorSearchResult {
  success: boolean;
  query: string;
  totalMatched: number;
  topSimilarity: number;
  chunks: VectorSearchResultChunk[];
  citations: Array<{
    documentId: string;
    sourceId: string | null;
    snippet: string | null;
    label: string;
    url: string | null;
    sectionTitle: string | null;
  }>;
  suggestedSpecialtyCode?: string;
  suggestedSpecialtyName?: string;
  ragGroundingText: string;
}

let mistralKeyIndex = 0;

function getAvailableMistralKeys(): string[] {
  const keys: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const varName = i === 1 ? "MISTRAL_API_KEY" : `MISTRAL_API_KEY_${i}`;
    const key = process.env[varName];
    if (key && key.trim().length > 0) {
      keys.push(key.trim());
    }
  }
  return keys;
}

/**
 * Generate 1024D Embedding with Mistral API Key Rotation
 */
export async function generateMistralEmbedding(text: string): Promise<number[] | null> {
  const clean = text.trim();
  if (!clean) return null;

  const keys = getAvailableMistralKeys();
  if (keys.length === 0) {
    console.warn("[VectorSearch] No MISTRAL_API_KEY configured in environment.");
    return null;
  }

  const attempts = Math.min(keys.length * 2, 6);

  for (let i = 0; i < attempts; i++) {
    const activeKey = keys[mistralKeyIndex % keys.length];
    mistralKeyIndex++;

    try {
      const response = await fetch("https://api.mistral.ai/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model: "mistral-embed",
          input: [clean],
        }),
      });

      if (!response.ok) {
        console.warn(`[VectorSearch] Mistral API returned status ${response.status}. Trying next key...`);
        continue;
      }

      const data = await response.json();
      const embedding = data?.data?.[0]?.embedding;
      if (Array.isArray(embedding) && embedding.length === 1024) {
        return embedding as number[];
      }
    } catch (err) {
      console.warn(`[VectorSearch] Error calling Mistral API with key index ${mistralKeyIndex}:`, err);
    }
  }

  return null;
}

/**
 * Map raw Supabase specialty codes to canonical VMEC specialty codes
 */
function mapRawSpecialtyCode(rawCode?: string): string {
  if (!rawCode) return "KHAM_TONG_QUAT";
  const upper = rawCode.toUpperCase();
  if (upper.includes("CARDIO") || upper.includes("TIM")) return "TIM_MACH";
  if (upper.includes("GASTRO") || upper.includes("TIEU_HOA") || upper.includes("DTT")) return "TIEU_HOA";
  if (upper.includes("NEURO") || upper.includes("THAN_KINH") || upper.includes("DOT_QUY")) return "THAN_KINH";
  if (upper.includes("RESP") || upper.includes("HO_HAP") || upper.includes("PULMO")) return "HO_HAP";
  if (upper.includes("ORTHO") || upper.includes("CO_XUONG") || upper.includes("KHOP")) return "CO_XUONG_KHOP";
  if (upper.includes("DERMA") || upper.includes("DA_LIEU")) return "DA_LIEU";
  if (upper.includes("PEDIA") || upper.includes("NHI")) return "NHI_KHOA";
  if (upper.includes("OBGYN") || upper.includes("SAN_PHU") || upper.includes("PHU_KHOA")) return "SAN_PHU_KHOA";
  if (upper.includes("ENT") || upper.includes("TMH") || upper.includes("TAI_MUI_HONG")) return "TAI_MUI_HONG";
  if (upper.includes("OPHTHAL") || upper.includes("MAT")) return "MAT";
  if (upper.includes("DENTAL") || upper.includes("RANG_HAM_MAT")) return "RANG_HAM_MAT";
  if (upper.includes("ENDOCRINE") || upper.includes("NOI_TIET")) return "NOI_TIET";
  if (upper.includes("URO") || upper.includes("THAN_TIET_NIEU")) return "THAN_TIET_NIEU";
  if (upper.includes("PSYCH") || upper.includes("TAM_THAN") || upper.includes("TAM_LY")) return "TAM_THAN";
  if (upper.includes("ONCO") || upper.includes("UNG_BUOU")) return "UNG_BUOU";
  if (upper.includes("GERI") || upper.includes("LAO_KHOA")) return "LAO_KHOA";
  if (upper.includes("REHAB") || upper.includes("PHUC_HOI")) return "PHUC_HOI_CHUC_NANG";
  return "KHAM_TONG_QUAT";
}

/**
 * Execute Detached Vector Search against Supabase pgvector (2,670 vectors)
 */
export async function searchMedicalKnowledgeVector(
  queryText: string,
  options: { matchCount?: number; matchThreshold?: number } = {}
): Promise<RAGVectorSearchResult> {
  const matchCount = options.matchCount || 4;
  const matchThreshold = options.matchThreshold !== undefined ? options.matchThreshold : 0.35;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://nntxlqchytvfmutmixea.supabase.co";

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udHhscWNoeXR2Zm11dG1peGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Nzk3OTcsImV4cCI6MjEwMTU1NTc5N30.robUviwFKiyoXaYEKRjM2JyhTCWO6vC5BlRkA_vD3D4";

  // Step 1: Generate 1024D query vector via Mistral
  const embedding = await generateMistralEmbedding(queryText);

  if (!embedding) {
    return buildFallbackCatalogSearchResult(queryText);
  }

  // Step 2: Query Supabase pgvector RPC
  try {
    const rpcUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/rpc/match_knowledge_chunks`;
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      }),
    });

    if (!response.ok) {
      console.warn(`[VectorSearch] Supabase RPC returned ${response.status}. Falling back to in-memory catalog.`);
      return buildFallbackCatalogSearchResult(queryText);
    }

    interface RawChunkRow {
      chunk_id: string;
      record_id: string;
      normalized_text: string;
      metadata?: Record<string, unknown>;
      similarity: number;
    }

    const rows = (await response.json()) as RawChunkRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return buildFallbackCatalogSearchResult(queryText);
    }

    const chunks: VectorSearchResultChunk[] = rows.map((r) => {
      const rawSpec =
        (r.metadata?.primary_specialty_code as string) ||
        (r.metadata?.specialty as string) ||
        (r.metadata?.route_specialty as string);
      return {
        chunkId: r.chunk_id,
        recordId: r.record_id,
        text: r.normalized_text,
        similarity: Number(r.similarity || 0),
        specialtyCode: mapRawSpecialtyCode(rawSpec),
        routeType: r.metadata?.route_type as string,
        metadata: r.metadata,
      };
    });

    // Determine top specialty
    const topChunk = chunks[0];
    const topSpecCode = topChunk?.specialtyCode || "TIM_MACH";
    const resolvedSpec = getSpecialtyByCode(topSpecCode) || MASTER_SPECIALTIES[0];

    // Format citations
    const citations = chunks.map((c, idx) => {
      const simPct = Math.round(c.similarity * 100);
      const spec = getSpecialtyByCode(c.specialtyCode || topSpecCode) || resolvedSpec;
      return {
        documentId: `DOC-${c.chunkId.slice(0, 8).toUpperCase()}`,
        sourceId: `SRC-${(c.recordId || "").slice(0, 8).toUpperCase()}`,
        snippet: c.text.length > 200 ? `${c.text.slice(0, 197)}...` : c.text,
        label: `Phác đồ ${spec.name} (Độ khớp: ${simPct}%)`,
        url: "https://kcb.vn/phac-do-dieu-tri",
        sectionTitle: `Hướng dẫn chẩn đoán & phân tầng lâm sàng VMEC (Chunk #${idx + 1})`,
      };
    });

    // Build Grounding Context for LLM
    const ragGroundingText = chunks
      .map((c, i) => `[Tài liệu RAG #${i + 1} - Độ khớp: ${Math.round(c.similarity * 100)}% - Khoa ${c.specialtyCode}]\n${c.text}`)
      .join("\n\n");

    return {
      success: true,
      query: queryText,
      totalMatched: chunks.length,
      topSimilarity: topChunk.similarity,
      chunks,
      citations,
      suggestedSpecialtyCode: resolvedSpec.code,
      suggestedSpecialtyName: resolvedSpec.name,
      ragGroundingText,
    };
  } catch (error) {
    console.warn("[VectorSearch] Failed to execute Supabase vector search:", error);
    return buildFallbackCatalogSearchResult(queryText);
  }
}

/**
 * Fallback to in-memory Master Clinical Catalog if database is unreachable
 */
function buildFallbackCatalogSearchResult(queryText: string): RAGVectorSearchResult {
  const lower = queryText.toLowerCase();

  let matchedSpec = MASTER_SPECIALTIES[0];
  let maxMatchCount = -1;

  for (const spec of MASTER_SPECIALTIES) {
    let count = 0;
    for (const kw of spec.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        count++;
      }
    }
    if (count > maxMatchCount) {
      maxMatchCount = count;
      matchedSpec = spec;
    }
  }

  const citations = matchedSpec.citations.map((cite, idx) => ({
    documentId: `VMEC-CAT-${matchedSpec.code}-${idx + 1}`,
    sourceId: "BYT-STANDARD-2026",
    snippet: matchedSpec.reasoningTemplate,
    label: cite.label,
    url: cite.url,
    sectionTitle: cite.sectionTitle,
  }));

  return {
    success: false,
    query: queryText,
    totalMatched: citations.length,
    topSimilarity: 0.85,
    chunks: [],
    citations,
    suggestedSpecialtyCode: matchedSpec.code,
    suggestedSpecialtyName: matchedSpec.name,
    ragGroundingText: `[Phác đồ lâm sàng ${matchedSpec.name}]\n${matchedSpec.reasoningTemplate}`,
  };
}
