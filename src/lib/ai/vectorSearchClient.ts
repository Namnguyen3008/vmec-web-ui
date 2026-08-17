/**
 * Pure Vector Search & RAG Retrieval Engine for VMEC Healthcare
 * - 100% EXCLUSIVE: Queries Supabase PostgreSQL pgvector across 2,670 Medical Embeddings
 * - Generates 1024D Embeddings with Mistral API Key Pool Rotation (13 Keys)
 * - In-Memory Master Clinical Catalog is DISABLED per user specification.
 */

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
 * Map raw Supabase specialty codes to canonical VMEC specialty codes & names
 */
export const SPECIALTY_META_MAP: Record<string, { code: string; name: string; doctor: string; room: string }> = {
  TIM_MACH: { code: "TIM_MACH", name: "Khoa Tim Mạch", doctor: "BS.CKII Trần Minh Đức", room: "Phòng 302 - Tòa A" },
  TIEU_HOA: { code: "TIEU_HOA", name: "Khoa Tiêu Hóa - Gan Mật", doctor: "BS.CKII Phạm Hoàng Long", room: "Phòng 205 - Tòa B" },
  THAN_KINH: { code: "THAN_KINH", name: "Khoa Thần Kinh & Đột Quỵ", doctor: "TS.BS Vũ Thành Trung", room: "Phòng 401 - Tòa A" },
  HO_HAP: { code: "HO_HAP", name: "Khoa Hô Hấp - Phổi", doctor: "BS.CKII Lê Thị Mai Hương", room: "Phòng 201 - Tòa A" },
  CO_XUONG_KHOP: { code: "CO_XUONG_KHOP", name: "Khoa Cơ Xương Khớp & Cột Sống", doctor: "BS.CKII Hoàng Tuấn Anh", room: "Phòng 305 - Tòa B" },
  DA_LIEU: { code: "DA_LIEU", name: "Khoa Da Liễu & Thẩm Mỹ Da", doctor: "ThS.BS Nguyễn Thu Trang", room: "Phòng 108 - Tòa C" },
  NHI_KHOA: { code: "NHI_KHOA", name: "Khoa Nhi & Sơ Sinh", doctor: "PGS.TS.BS Đặng Thúy Hà", room: "Phòng 102 - Tòa B" },
  SAN_PHU_KHOA: { code: "SAN_PHU_KHOA", name: "Khoa Sản Phụ Khoa", doctor: "BS.CKII Bùi Thị Thanh Vân", room: "Phòng 208 - Tòa A" },
  TAI_MUI_HONG: { code: "TAI_MUI_HONG", name: "Khoa Tai Mũi Họng", doctor: "BS.CKII Đinh Mạnh Cường", room: "Phòng 105 - Tòa A" },
  MAT: { code: "MAT", name: "Khoa Mắt (Nhãn Khoa)", doctor: "TS.BS Phan Bảo Trâm", room: "Phòng 301 - Tòa C" },
  RANG_HAM_MAT: { code: "RANG_HAM_MAT", name: "Khoa Răng Hàm Mặt", doctor: "ThS.BS Trịnh Quốc Đạt", room: "Phòng 203 - Tòa C" },
  NOI_TIET: { code: "NOI_TIET", name: "Khoa Nội Tiết & Đái Tháo Đường", doctor: "BS.CKII Đỗ Phương Linh", room: "Phòng 206 - Tòa B" },
  THAN_TIET_NIEU: { code: "THAN_TIET_NIEU", name: "Khoa Thận - Tiết Niệu & Nam Học", doctor: "BS.CKII Nguyễn Hải Đăng", room: "Phòng 308 - Tòa B" },
  TAM_THAN: { code: "TAM_THAN", name: "Khoa Sức Khỏe Tâm Thần & Tâm Lý", doctor: "TS.BS Lâm Quốc Triệu", room: "Phòng 405 - Tòa A" },
  UNG_BUOU: { code: "UNG_BUOU", name: "Khoa Ung Bướu & Y Học Hạt Nhân", doctor: "PGS.TS.BS Trần Đình Cương", room: "Phòng 501 - Tòa B" },
  LAO_KHOA: { code: "LAO_KHOA", name: "Khoa Lão Khoa & Chăm Sóc Toàn Diện", doctor: "BS.CKII Hoàng Thị Nga", room: "Phòng 106 - Tòa A" },
  TRUYEN_NHIEM: { code: "TRUYEN_NHIEM", name: "Khoa Bệnh Truyền Nhiễm & Nhiệt Đới", doctor: "BS.CKI Ngô Đức Trọng", room: "Phòng 103 - Khu Truyền Nhiễm" },
  KHAM_TONG_QUAT: { code: "KHAM_TONG_QUAT", name: "Khoa Nội Tổng Quát & Tầm Soát", doctor: "BS.CKI Đỗ Quang Huy", room: "Phòng 101 - Tòa A" },
};

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
  if (upper.includes("INFECT") || upper.includes("TRUYEN_NHIEM") || upper.includes("DENGUE")) return "TRUYEN_NHIEM";
  return "KHAM_TONG_QUAT";
}

/**
 * Execute Detached Vector Search STRICTLY against Supabase pgvector (2,670 vectors)
 * Master Catalog fallback is completely disabled.
 */
export async function searchMedicalKnowledgeVector(
  queryText: string,
  options: { matchCount?: number; matchThreshold?: number } = {}
): Promise<RAGVectorSearchResult> {
  const matchCount = options.matchCount || 4;
  const matchThreshold = options.matchThreshold !== undefined ? options.matchThreshold : 0.2;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://nntxlqchytvfmutmixea.supabase.co";

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5udHhscWNoeXR2Zm11dG1peGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5Nzk3OTcsImV4cCI6MjEwMTU1NTc5N30.robUviwFKiyoXaYEKRjM2JyhTCWO6vC5BlRkA_vD3D4";

  // Step 1: Generate 1024D query vector via Mistral API
  const embedding = await generateMistralEmbedding(queryText);

  if (!embedding) {
    console.error("[VectorSearch] Failed to generate 1024D embedding from Mistral API.");
    return {
      success: false,
      query: queryText,
      totalMatched: 0,
      topSimilarity: 0,
      chunks: [],
      citations: [],
      ragGroundingText: "",
    };
  }

  // Step 2: Query Supabase pgvector RPC (2,670 vectors)
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
      console.error(`[VectorSearch] Supabase pgvector RPC returned error status: ${response.status}`);
      return {
        success: false,
        query: queryText,
        totalMatched: 0,
        topSimilarity: 0,
        chunks: [],
        citations: [],
        ragGroundingText: "",
      };
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
      console.warn("[VectorSearch] No matching vectors found in 2,670 knowledge_embeddings table.");
      return {
        success: false,
        query: queryText,
        totalMatched: 0,
        topSimilarity: 0,
        chunks: [],
        citations: [],
        ragGroundingText: "",
      };
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

    // Determine top specialty strictly from the closest vector in pgvector
    const topChunk = chunks[0];
    const topSpecCode = topChunk?.specialtyCode || "TIM_MACH";
    const meta = SPECIALTY_META_MAP[topSpecCode] || SPECIALTY_META_MAP.TIM_MACH;

    // Format citations directly from Supabase vector chunks
    const citations = chunks.map((c, idx) => {
      const simPct = Math.round(c.similarity * 100);
      const specMeta = SPECIALTY_META_MAP[c.specialtyCode || topSpecCode] || meta;
      return {
        documentId: `DOC-${c.chunkId.slice(0, 8).toUpperCase()}`,
        sourceId: `SRC-${(c.recordId || "").slice(0, 8).toUpperCase()}`,
        snippet: c.text.length > 220 ? `${c.text.slice(0, 217)}...` : c.text,
        label: `Phác đồ ${specMeta.name} (Độ khớp Vector: ${simPct}%)`,
        url: "https://kcb.vn/phac-do-dieu-tri",
        sectionTitle: `Cơ sở tri thức Supabase pgvector 2.670 (Chunk #${idx + 1})`,
      };
    });

    // Build Grounding Context for LLM
    const ragGroundingText = chunks
      .map(
        (c, i) =>
          `[Tài liệu Supabase pgvector #${i + 1} - Độ khớp: ${Math.round(c.similarity * 100)}% - Khoa: ${c.specialtyCode}]\n${c.text}`
      )
      .join("\n\n");

    return {
      success: true,
      query: queryText,
      totalMatched: chunks.length,
      topSimilarity: topChunk.similarity,
      chunks,
      citations,
      suggestedSpecialtyCode: meta.code,
      suggestedSpecialtyName: meta.name,
      ragGroundingText,
    };
  } catch (error) {
    console.error("[VectorSearch] Exception querying Supabase pgvector:", error);
    return {
      success: false,
      query: queryText,
      totalMatched: 0,
      topSimilarity: 0,
      chunks: [],
      citations: [],
      ragGroundingText: "",
    };
  }
}
