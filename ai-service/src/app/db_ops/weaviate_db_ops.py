from typing import Any

import weaviate
from weaviate.classes.query import MetadataQuery


async def embed_text_in_weaviate(
    client: weaviate.WeaviateAsyncClient, text: str, collection: str
) -> dict[str, Any]:
    """
    Embed text in Weaviate without using a vectorizer.
    Note: You must provide vectors manually or use a custom vectorizer.
    This example stores the text as a property.
    """
    try:
        col = client.collections.get(collection)

        # Create object with text property
        uuid = await col.data.insert(
            properties={"text": text},
        )

        return {
            "text": text,
            "collection": collection,
            "uuid": str(uuid),
        }
    except Exception as e:
        raise ValueError(f"Failed to embed text: {str(e)}") from e


async def search_in_weaviate(
    client: weaviate.WeaviateAsyncClient, query: str, collection: str, limit: int = 10
) -> dict[str, Any]:
    """
    Search for similar objects in Weaviate using BM25.
    Falls back to BM25 since no vectorizer is configured.
    """
    try:
        col = client.collections.get(collection)

        # Use BM25 search since no vectorizer is configured
        response = await col.query.bm25(
            query=query,
            limit=limit,
            return_metadata=MetadataQuery(distance=True),
        )

        results = []
        if response.objects:
            for obj in response.objects:
                results.append(
                    {
                        "uuid": str(obj.uuid),
                        "text": obj.properties.get("text", ""),
                        "distance": obj.metadata.distance,
                        "properties": obj.properties,
                    }
                )

        return {
            "query": query,
            "collection": collection,
            "results": results,
            "count": len(results),
        }
    except Exception as e:
        raise ValueError(f"Failed to search: {str(e)}") from e
