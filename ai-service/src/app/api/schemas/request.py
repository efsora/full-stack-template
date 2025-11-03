from pydantic import BaseModel, Field, computed_field

PASS_WEAK_BORDER = 8
PASS_MEDIUM_BORDER = 12


class CreateUserRequest(BaseModel):
    user_name: str = Field(..., min_length=3, max_length=50)
    user_surname: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=6)

    @computed_field
    def password_strength(self) -> str:
        if len(self.password) < PASS_WEAK_BORDER:
            return "weak"
        elif len(self.password) < PASS_MEDIUM_BORDER:
            return "medium"
        else:
            return "strong"


class EmbedRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    collection: str = Field(..., min_length=1, max_length=100)


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=10000)
    collection: str = Field(..., min_length=1, max_length=100)
    limit: int = Field(default=10, ge=1, le=100)
