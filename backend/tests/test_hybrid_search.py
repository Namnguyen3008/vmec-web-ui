import pytest

from src.services.hybrid_search import HybridSearchClient, get_hybrid_client


@pytest.mark.asyncio
async def test_hybrid_search_cardio():
    client = get_hybrid_client()
    res = await client.search("Tôi bị đau thắt ngực lan lên vai trái, vã mồ hôi hột")
    
    assert res.top_specialty_code in ("TIM_MACH", "CAP_CUU")
    assert res.confidence >= 0.80
    assert len(res.citations) > 0
    assert len(res.grounding_text) > 0
    assert res.total_latency_ms > 0


@pytest.mark.asyncio
async def test_hybrid_search_gastro():
    client = get_hybrid_client()
    res = await client.search("Tôi bị ợ chua nóng rát sau xương ức sau khi ăn no")
    
    assert res.top_specialty_code == "TIEU_HOA"
    assert "Khoa Tiêu Hóa" in res.top_specialty_name
    assert len(res.citations) > 0
