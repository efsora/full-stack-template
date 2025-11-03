from pydantic import BaseModel


class HelloResponse(BaseModel):
    message: str


class CreateUserResponse(BaseModel):
    user_name: str
    user_surname: str
    email: str


class EmbedResponse(BaseModel):
    text: str
    collection: str
    uuid: str


class SearchResult(BaseModel):
    uuid: str
    text: str
    distance: float | None = None
    properties: dict[str, object] | None = None


class SearchResponse(BaseModel):
    query: str
    collection: str
    results: list[SearchResult]
    count: int
