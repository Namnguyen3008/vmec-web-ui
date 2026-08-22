import asyncio
import io
import logging
import os
import sys
import time

# Set utf-8 stdout
if sys.stdout and hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# Suppress debug logs during benchmark
logging.getLogger("azure.cosmos").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("vmec").setLevel(logging.WARNING)

sys.path.insert(0, os.path.abspath("backend"))

from src.agents.executor import get_agent_executor
from src.services.emergency import screen_emergency
from src.services.unified_retrieval import get_unified_retrieval_engine


async def run_benchmark():
    engine = get_unified_retrieval_engine()
    executor = get_agent_executor()

    # Warmup
    screen_emergency("Đau ngực dữ dội")
    await engine.search("Đau rát ngực và ợ chua")
    await executor.process_turn("bench_warm_1", "user_warm_1", "chào bác sĩ")

    print("\n=======================================================")
    print("      BẢNG TỔNG HỢP ĐỘ TRỄ HỆ THỐNG VMEC HEALTHCARE   ")
    print("=======================================================")

    # 1. Emergency Gate (Tầng 0 - Deterministic Safety)
    runs_em = []
    for _ in range(5):
        t0 = time.perf_counter()
        screen_emergency("Tôi đau ngực dữ dội, khó thở muốn ngất xỉu, vã mồ hôi lạnh")
        runs_em.append((time.perf_counter() - t0) * 1000)
    avg_em = sum(runs_em) / len(runs_em)

    # 2. Unified Retrieval Engine (Tầng 2 - Quad Retrieval + FlashRank)
    t0 = time.perf_counter()
    u_res = await engine.search(
        "Đau rát sau xương ức, ợ chua đầy bụng sau khi ăn, không khó thở và không sốt",
        match_count=5,
    )
    t_retrieval = (time.perf_counter() - t0) * 1000

    # 3. Multi-turn Turn 1 (Slot Gating + Interrogation LLM + Cosmos DB Session)
    t0 = time.perf_counter()
    res_turn1 = await executor.process_turn(
        "bench_sess_live_1", "bench_user_live_1", "Tôi bị đau ngực và ợ chua"
    )
    t_turn1 = (time.perf_counter() - t0) * 1000

    # 4. Multi-turn Turn 2 (4 Slots Complete + Full Quad-Retrieval + Gemini Grounding + Validation + Cosmos DB)
    t0 = time.perf_counter()
    res_turn2 = await executor.process_turn(
        "bench_sess_live_1",
        "bench_user_live_1",
        "Đau rát sau xương ức kéo dài 5 ngày sau ăn no, không khó thở",
    )
    t_turn2 = (time.perf_counter() - t0) * 1000

    print(f"\n1. CỔNG AN TOÀN TẤT ĐỊNH (Tầng 0 - Emergency 115 Interception):")
    print(f"   ► Thời gian phản hồi: {avg_em:.2f} ms (< 1 ms)\n")

    print(f"2. ĐỘNG CƠ UNIFIED RETRIEVAL ENGINE (Tầng 2 - Quad-Retrieval & Rerank):")
    print(f"   ► Tổng thời gian Retrieval: {t_retrieval:.2f} ms")
    for k, v in u_res.latency_breakdown.items():
        print(f"     • {k}: {v:.2f} ms")

    print(f"\n3. PHẢN HỒI LÂM SÀNG ĐA LƯỢT (Multi-turn Clinical Triage):")
    print(f"   ► Lượt 1 (Hỏi làm rõ slot triệu chứng còn thiếu): {t_turn1:.2f} ms (~{t_turn1/1000:.2f} s)")
    print(f"   ► Lượt 2 (Đủ 4 slot + Quad-RAG + Gemini Grounding + Phân luồng): {t_turn2:.2f} ms (~{t_turn2/1000:.2f} s)\n")
    print("=======================================================\n")


if __name__ == "__main__":
    asyncio.run(run_benchmark())
