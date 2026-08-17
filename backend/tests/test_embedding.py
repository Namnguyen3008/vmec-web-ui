import pytest

from src.services.embedding import get_embedding_service


@pytest.mark.asyncio
async def test_mistral_embed_single_text():
    service = get_embedding_service()
    vector = await service.embed_text("triệu chứng đau ngực khó thở khi leo cầu thang")
    assert isinstance(vector, list)
    assert len(vector) == 1024
    assert all(isinstance(val, float) for val in vector)


@pytest.mark.asyncio
async def test_mistral_embed_batch():
    service = get_embedding_service()
    texts = [
        "đau tức ngực vùng xương ức",
        "đau dạ dày ợ chua thượng vị",
    ]
    vectors = await service.embed_batch(texts)
    assert len(vectors) == 2
    assert len(vectors[0]) == 1024
    assert len(vectors[1]) == 1024
