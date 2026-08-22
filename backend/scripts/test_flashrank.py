import io
import sys
import time

if sys.stdout and hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from flashrank import Ranker, RerankRequest

try:
    ranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2", cache_dir="backend/data/cache")
    query = "đau ngực và ợ chua"
    passages = [
        {"id": 1, "text": "Bệnh nhân đau tức ngực trái dữ dội, vã mồ hôi, nghi nhồi máu cơ tim."},
        {"id": 2, "text": "Triệu chứng trào ngược dạ dày thực quản gồm đau rát sau xương ức, ợ chua sau khi ăn."},
        {"id": 3, "text": "Viêm da cơ địa gây mẩn ngứa, phát ban thành mảng đỏ."}
    ]
    t0 = time.perf_counter()
    rerank_req = RerankRequest(query=query, passages=passages)
    results = ranker.rerank(rerank_req)
    dur = (time.perf_counter() - t0) * 1000
    print(f"Rerank finished in {dur:.2f}ms:")
    for r in results:
        print(f" -> ID {r['id']}: Score={r['score']:.4f} | {r['text'][:60]}...")
except Exception as ex:
    print(f"FlashRank error: {ex}")
