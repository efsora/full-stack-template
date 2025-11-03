from httpx import AsyncClient
import pytest


@pytest.mark.asyncio
async def test_embed_text_success(client: AsyncClient) -> None:
    """Test embedding text successfully."""
    payload = {
        "text": "This is a test document",
        "collection": "test_collection",
    }

    response = await client.post("/api/v1/weaviate/embed", json=payload)

    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert data["data"]["text"] == payload["text"]
    assert data["data"]["collection"] == payload["collection"]
    assert "uuid" in data["data"]
    assert len(data["data"]["uuid"]) > 0


@pytest.mark.asyncio
async def test_embed_multiple_texts(client: AsyncClient) -> None:
    """Test embedding multiple texts."""
    texts = [
        "First test document",
        "Second test document",
        "Third test document",
    ]

    uuids = []
    for text in texts:
        payload = {"text": text, "collection": "test_collection"}
        response = await client.post("/api/v1/weaviate/embed", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["success"] is True
        uuids.append(data["data"]["uuid"])

    # All UUIDs should be unique
    assert len(uuids) == len(set(uuids))


@pytest.mark.asyncio
async def test_search_after_embed(client: AsyncClient) -> None:
    """Test searching after embedding texts."""
    # First, embed some texts
    embed_texts = [
        "Python is a programming language",
        "JavaScript is used for web development",
        "Golang is fast and efficient",
    ]

    for text in embed_texts:
        payload = {"text": text, "collection": "test_collection"}
        response = await client.post("/api/v1/weaviate/embed", json=payload)
        assert response.status_code == 201

    # Now search
    search_payload = {
        "query": "programming language",
        "collection": "test_collection",
        "limit": 10,
    }

    response = await client.post("/api/v1/weaviate/search", json=search_payload)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["success"] is True
    assert data["data"]["query"] == search_payload["query"]
    assert data["data"]["collection"] == search_payload["collection"]
    assert isinstance(data["data"]["results"], list)
    assert data["data"]["count"] >= 0


@pytest.mark.asyncio
async def test_search_with_limit(client: AsyncClient) -> None:
    """Test search respects limit parameter."""
    # Embed multiple texts
    for i in range(5):
        payload = {
            "text": f"Document number {i} about programming",
            "collection": "test_collection",
        }
        response = await client.post("/api/v1/weaviate/embed", json=payload)
        assert response.status_code == 201

    # Search with limit 2
    search_payload = {
        "query": "programming",
        "collection": "test_collection",
        "limit": 2,
    }

    response = await client.post("/api/v1/weaviate/search", json=search_payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    # Results should be at most 2
    assert len(data["data"]["results"]) <= 2


@pytest.mark.asyncio
async def test_embed_invalid_collection(client: AsyncClient) -> None:
    """Test embedding with invalid collection."""
    payload = {
        "text": "Test text",
        "collection": "",  # Invalid empty collection
    }

    response = await client.post("/api/v1/weaviate/embed", json=payload)

    # Should fail validation
    assert response.status_code == 422  # Unprocessable Entity


@pytest.mark.asyncio
async def test_embed_empty_text(client: AsyncClient) -> None:
    """Test embedding with empty text."""
    payload = {
        "text": "",  # Invalid empty text
        "collection": "test_collection",
    }

    response = await client.post("/api/v1/weaviate/embed", json=payload)

    # Should fail validation
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_invalid_limit(client: AsyncClient) -> None:
    """Test search with invalid limit."""
    payload = {
        "query": "test",
        "collection": "test_collection",
        "limit": 1000,  # Exceeds max limit of 100
    }

    response = await client.post("/api/v1/weaviate/search", json=payload)

    # Should fail validation
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_empty_collection(client: AsyncClient) -> None:
    """Test search on empty collection."""
    # Search without embedding anything
    payload = {
        "query": "test",
        "collection": "empty_collection",
        "limit": 10,
    }

    response = await client.post("/api/v1/weaviate/search", json=payload)

    # Should return empty results, not error
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]["results"]) == 0
    assert data["data"]["count"] == 0


@pytest.mark.asyncio
async def test_response_format(client: AsyncClient) -> None:
    """Test that responses follow the standard AppResponse format."""
    payload = {
        "text": "Test document",
        "collection": "test_collection",
    }

    response = await client.post("/api/v1/weaviate/embed", json=payload)

    assert response.status_code == 201
    data = response.json()

    # Check standard response fields
    assert "success" in data
    assert "data" in data
    assert "message" in data or "message" == None
    assert "trace_id" in data or "trace_id" == None
    assert "error" in data or "error" == None


@pytest.mark.asyncio
async def test_multiple_collections(client: AsyncClient) -> None:
    """Test working with multiple collections."""
    collections = ["collection_1", "collection_2", "collection_3"]

    for collection in collections:
        payload = {
            "text": f"Document in {collection}",
            "collection": collection,
        }
        response = await client.post("/api/v1/weaviate/embed", json=payload)
        assert response.status_code == 201

    # Verify each collection can be searched independently
    for collection in collections:
        search_payload = {
            "query": "Document",
            "collection": collection,
            "limit": 10,
        }
        response = await client.post("/api/v1/weaviate/search", json=search_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
