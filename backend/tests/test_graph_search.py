import pytest

from src.services.graph_search import GraphSearchClient, get_graph_client


def test_graph_search_initialization():
    client = get_graph_client()
    assert client is not None


def test_graph_search_cardio_emergency():
    client = get_graph_client()
    res = client.search("Tôi bị đau thắt ngực dữ dội, vã mồ hôi và khó thở khi leo cầu thang")
    
    assert res.top_specialty_code in ("TIM_MACH", "CAP_CUU")
    assert res.confidence >= 0.75
    assert len(res.subgraph_paths) > 0
    assert res.is_emergency is True or res.emergency_probability > 0.50
    assert res.latency_ms < 500.0  # Fast graph traversal (<500ms on cold start, <15ms on warm)


def test_graph_search_gastroenterology():
    client = get_graph_client()
    res = client.search("Tôi bị đau rát thượng vị, ợ chua và đầy bụng khó tiêu sau bữa ăn")
    
    assert res.top_specialty_code == "TIEU_HOA"
    assert "Khoa Tiêu Hóa" in res.top_specialty_name
    assert res.confidence >= 0.80


def test_graph_search_dermatology():
    client = get_graph_client()
    res = client.search("Da tôi bị mẩn ngứa, nổi mề đay thành từng mảng đỏ khắp người")
    
    assert res.top_specialty_code == "DA_LIEU"
    assert "Khoa Da Liễu" in res.top_specialty_name
