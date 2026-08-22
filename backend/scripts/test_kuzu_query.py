import io
import sys
import time
import kuzu

if sys.stdout and hasattr(sys.stdout, "buffer"):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

db = kuzu.Database("backend/data/kuzu_clinical_graph")
conn = kuzu.Connection(db)

test_cases = [
    ("Đau ngực dữ dội, vã mồ hôi và khó thở", ["đau ngực", "vã mồ hôi", "khó thở"]),
    ("Đau bụng vùng thượng vị, ợ chua và đầy bụng sau khi ăn", ["thượng vị", "ợ chua", "đầy bụng"]),
    ("Đau đầu chóng mặt, mất ngủ kéo dài", ["đau đầu", "chóng mặt", "mất ngủ"]),
    ("Mẩn ngứa nổi mề đay khắp người", ["mẩn ngứa", "mề đay"]),
]

for title, ngrams in test_cases:
    print("=" * 60)
    print(f"CASE: {title}")
    print(f"Terms: {ngrams}")
    
    where_parts = [f"s.normalized_name CONTAINS '{ng.lower()}'" for ng in ngrams]
    where_str = " OR ".join(where_parts)
    
    cypher = f"""
        MATCH (s:Symptom)-[r:INDICATES]->(sp:Specialty)
        WHERE {where_str}
        RETURN sp.code, sp.name, sum(r.weight) AS score, sum(r.frequency) AS total_freq
        ORDER BY score DESC
        LIMIT 3
    """
    t0 = time.perf_counter()
    res = conn.execute(cypher)
    dur = (time.perf_counter() - t0) * 1000
    print(f"-> Traversal Results ({dur:.2f}ms):")
    while res.has_next():
        row = res.get_next()
        print(f"   [{row[0]}] {row[1]} (Score: {row[2]:.2f}, Freq: {row[3]})")
        
    # Emergency Risk
    cypher_risk = f"""
        MATCH (s:Symptom)-[r:HAS_RISK]->(rl:RiskLevel)
        WHERE ({where_str}) AND rl.code = 'EMERGENCY'
        RETURN sum(r.frequency) AS em_freq, avg(r.emergency_weight) AS avg_em_weight
    """
    res_risk = conn.execute(cypher_risk)
    if res_risk.has_next():
        r = res_risk.get_next()
        em_f = r[0] if r[0] is not None else 0
        em_w = r[1] if r[1] is not None else 0.0
        print(f"-> Emergency Risk: Freq={em_f}, Probability={em_w:.2%}")
