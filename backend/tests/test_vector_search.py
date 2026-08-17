import pytest

from src.services.vector_search import get_vector_client


@pytest.mark.asyncio
async def test_supabase_vector_search_cardio():
    client = get_vector_client()
    query = "đau thắt ngực lan ra cánh tay trái khi làm việc gắng sức, hồi hộp đánh trống ngực"
    result = await client.search(query, match_count=3)

    assert result.top_specialty_code != ""
    assert result.top_specialty_name != ""
    assert result.confidence >= 0.70
    assert len(result.matched_chunks) > 0
    assert len(result.citations) > 0
    assert result.latency_ms > 0
